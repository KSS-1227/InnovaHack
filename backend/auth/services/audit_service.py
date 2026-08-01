"""
Audit service — write and query the public.audit_log table.

All public functions are async. The Supabase service-role client is used for
all DB operations (bypasses RLS).

``log_event`` MUST NEVER raise — audit failures must not block the calling
operation. ``query_audit_log`` raises on DB errors (callers can handle them).

Requirements: 10.1–10.5
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime, timezone
from uuid import uuid4

from backend.auth.models.audit import AuditEventType, AuditLogEntry, AuditLogPage
from backend.auth.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# Max rows returned per page (hard cap).
_MAX_PAGE_SIZE = 200


# ---------------------------------------------------------------------------
# Cursor helpers
# ---------------------------------------------------------------------------


def _encode_cursor(ts: datetime) -> str:
    """Base64url-encode an ISO-format UTC timestamp for use as a page cursor."""
    iso = ts.isoformat()
    return base64.urlsafe_b64encode(iso.encode()).decode()


def _decode_cursor(cursor: str) -> datetime | None:
    """Decode a cursor produced by ``_encode_cursor``.

    Returns ``None`` if the cursor is malformed or cannot be parsed, so the
    caller can gracefully fall back to the first page.
    """
    try:
        iso = base64.urlsafe_b64decode(cursor.encode()).decode()
        return datetime.fromisoformat(iso)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def log_event(
    event_type: AuditEventType,
    user_id: str | None,
    workspace_id: str | None,
    source_ip: str,
    detail: str,
) -> None:
    """Insert a single audit log row.

    This function catches **all** exceptions and logs them at ERROR level.
    It NEVER propagates an exception to the caller — audit failures must not
    interrupt the triggering operation.

    Parameters
    ----------
    event_type:
        One of the 14 ``AuditEventType`` literals.
    user_id:
        UUID of the acting user, or ``None`` for system events.
    workspace_id:
        UUID of the relevant workspace, or ``None``.
    source_ip:
        The client IP address (e.g. from ``request.client.host``).
    detail:
        Human-readable description. Truncated to 2 000 characters.
    """
    try:
        supabase = await get_supabase_client()
        await supabase.from_("audit_log").insert(
            {
                "entry_id": str(uuid4()),
                "event_type": event_type,
                "user_id": user_id,
                "workspace_id": workspace_id,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                "source_ip": source_ip,
                "detail": detail[:2000],
            }
        ).execute()
    except Exception as exc:  # pragma: no cover — never raise, only log
        logger.error(
            "audit log insert failed (event_type=%s, user_id=%s): %s",
            event_type,
            user_id,
            exc,
        )


async def query_audit_log(
    workspace_id: str,
    cursor: str | None = None,
    limit: int | None = None,
) -> AuditLogPage:
    """Return a cursor-paginated page of audit log entries for a workspace.

    Entries are ordered by ``timestamp DESC`` (newest first).

    Parameters
    ----------
    workspace_id:
        Only entries matching this workspace are returned.
    cursor:
        Opaque page cursor returned by a previous call.  When provided, only
        entries with ``timestamp < cursor_timestamp`` are returned.  A
        malformed cursor is silently ignored (the query starts from the
        beginning).
    limit:
        Maximum number of entries to return.  Clamped to [1, 200]; defaults
        to 200 when ``None`` or when the provided value exceeds 200.

    Returns
    -------
    AuditLogPage
        ``entries`` contains the matching rows; ``next_cursor`` is ``None``
        when there are no further pages (fewer rows than ``limit`` were
        returned).
    """
    # ── 1. Resolve effective page size ────────────────────────────────────────
    if limit is None or limit > _MAX_PAGE_SIZE:
        effective_limit = _MAX_PAGE_SIZE
    else:
        effective_limit = max(1, limit)

    # ── 2. Decode cursor ──────────────────────────────────────────────────────
    cursor_ts: datetime | None = None
    if cursor:
        cursor_ts = _decode_cursor(cursor)
        # _decode_cursor returns None for malformed cursors → start from top

    # ── 3. Build query ────────────────────────────────────────────────────────
    supabase = await get_supabase_client()
    query = (
        supabase.from_("audit_log")
        .select(
            "entry_id, event_type, user_id, workspace_id, timestamp, source_ip, detail"
        )
        .eq("workspace_id", workspace_id)
        .order("timestamp", desc=True)
        .limit(effective_limit)
    )

    if cursor_ts is not None:
        query = query.lt("timestamp", cursor_ts.isoformat())

    # ── 4. Execute ────────────────────────────────────────────────────────────
    result = await query.execute()
    rows = result.data or []

    # ── 5. Deserialise rows into AuditLogEntry ────────────────────────────────
    entries: list[AuditLogEntry] = []
    for row in rows:
        entries.append(
            AuditLogEntry(
                entry_id=row["entry_id"],
                event_type=row["event_type"],
                user_id=row.get("user_id"),
                workspace_id=row.get("workspace_id"),
                timestamp=datetime.fromisoformat(row["timestamp"]),
                source_ip=row["source_ip"],
                detail=row["detail"],
            )
        )

    # ── 6. Build next_cursor ──────────────────────────────────────────────────
    # A next_cursor exists only when we received a full page (there may be more).
    next_cursor: str | None = None
    if len(entries) == effective_limit:
        next_cursor = _encode_cursor(entries[-1].timestamp)

    return AuditLogPage(entries=entries, next_cursor=next_cursor)
