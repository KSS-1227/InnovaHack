"""
Workspace routes — list, create, delete workspaces and manage members.

Mounted at /api/workspaces in main.py; no prefix is defined here.

All endpoints require a valid JWT. Permission-protected endpoints additionally
require the requesting user to hold the specified RBAC permission.

Requirements: 7.1–7.11, 8.1–8.8
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.auth.middleware.jwt_middleware import AuthContext, get_current_user
from backend.auth.models.workspace import (
    MemberInviteRequest,
    MemberRoleChangeRequest,
    WorkspaceCreateRequest,
    WorkspaceResponse,
)
from backend.auth.rbac.engine import require_permission
from backend.auth.rbac.permissions import Permission
from backend.auth.services import workspace_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Workspace endpoints
# ---------------------------------------------------------------------------


@router.get("")
@router.get("/")
async def list_workspaces(
    auth: AuthContext = Depends(get_current_user),
) -> JSONResponse:
    """Return all active workspaces the authenticated user belongs to.

    Returns
    -------
    JSONResponse 200
        List of WorkspaceResponse dicts.
    """
    workspaces = await workspace_service.list_workspaces(auth.user_id)
    return JSONResponse(status_code=200, content=workspaces)


@router.post("")
@router.post("/")
async def create_workspace(
    body: WorkspaceCreateRequest,
    auth: AuthContext = Depends(get_current_user),
) -> JSONResponse:
    """Create a new workspace; the authenticated user becomes its Admin owner.

    Returns
    -------
    JSONResponse 201
        WorkspaceResponse dict.

    Raises
    ------
    HTTPException 409
        A workspace with this name already exists.
    HTTPException 422
        Workspace name is outside the 3–80 character range.
    """
    result = await workspace_service.create_workspace(auth.user_id, body.name)
    return JSONResponse(status_code=201, content=result)


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    auth: AuthContext = Depends(require_permission(Permission.DELETE_WORKSPACE)),
) -> JSONResponse:
    """Soft-delete a workspace (requires DELETE_WORKSPACE permission).

    Returns
    -------
    JSONResponse 200
        ``{"message": "Workspace deleted successfully"}``

    Raises
    ------
    HTTPException 403
        Requesting user lacks the DELETE_WORKSPACE permission.
    HTTPException 404
        Workspace not found or already deleted.
    """
    result = await workspace_service.delete_workspace(workspace_id, auth.user_id)
    return JSONResponse(status_code=200, content=result)


# ---------------------------------------------------------------------------
# Member management endpoints
# ---------------------------------------------------------------------------


@router.post("/{workspace_id}/members")
async def invite_member(
    workspace_id: str,
    body: MemberInviteRequest,
    auth: AuthContext = Depends(require_permission(Permission.MANAGE_MEMBERS)),
) -> JSONResponse:
    """Invite a user to the workspace by email (requires MANAGE_MEMBERS permission).

    Returns
    -------
    JSONResponse 201
        ``{"message": "Invitation sent", "member_id": str}``

    Raises
    ------
    HTTPException 403
        Requesting user lacks the MANAGE_MEMBERS permission.
    HTTPException 404
        No account found for the supplied email address.
    HTTPException 422
        Workspace has already reached the 50-member cap.
    """
    result = await workspace_service.invite_member(
        workspace_id, body.email, body.role, auth.user_id
    )
    return JSONResponse(status_code=201, content=result)


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_member(
    workspace_id: str,
    user_id: str,
    auth: AuthContext = Depends(require_permission(Permission.MANAGE_MEMBERS)),
) -> JSONResponse:
    """Remove a member from a workspace (requires MANAGE_MEMBERS permission).

    Returns
    -------
    JSONResponse 200
        ``{"message": "Member removed successfully"}``

    Raises
    ------
    HTTPException 403
        Requesting user lacks the MANAGE_MEMBERS permission.
    HTTPException 404
        Target member not found in the workspace.
    """
    result = await workspace_service.remove_member(workspace_id, user_id, auth.user_id)
    return JSONResponse(status_code=200, content=result)


@router.patch("/{workspace_id}/members/{user_id}/role")
async def change_member_role(
    workspace_id: str,
    user_id: str,
    body: MemberRoleChangeRequest,
    auth: AuthContext = Depends(require_permission(Permission.MANAGE_MEMBERS)),
) -> JSONResponse:
    """Change a workspace member's role (requires MANAGE_MEMBERS permission).

    Returns
    -------
    JSONResponse 200
        ``{"message": "Role updated successfully", "new_role": str}``

    Raises
    ------
    HTTPException 403
        Requesting user lacks the MANAGE_MEMBERS permission.
    HTTPException 404
        Target member not found in the workspace.
    HTTPException 409
        Attempting to demote the sole remaining Admin.
    """
    result = await workspace_service.change_member_role(
        workspace_id, user_id, body.role, auth.user_id
    )
    return JSONResponse(status_code=200, content=result)
