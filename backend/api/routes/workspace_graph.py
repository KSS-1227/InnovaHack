"""
Workspace-aware graph route.

Replaces graph.py for authenticated requests.
Graph files are read from:
    data/users/{user_id}/cases/{case_id}/output/graph.graphml

The original graph.py is NOT modified.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
import networkx as nx

from backend.auth.dependencies import get_current_user
from backend.auth.middleware.jwt_middleware import AuthContext
from backend.auth.workspace import UserWorkspace
from backend.auth.services.case_service import get_case as _verify_case_ownership

router = APIRouter(
    prefix="/graph",
    tags=["Knowledge Graph"],
)


def _load_graph(ws: UserWorkspace) -> nx.Graph:
    """Load the graph from the user's workspace output directory."""
    # Try workspace graph.graphml first, then MMKG_NAME fallback
    from backend.config import MMKG_NAME
    candidates = [
        ws.graph_path,
        ws.output / f"{MMKG_NAME}.graphml",
    ]
    for path in candidates:
        if path.exists():
            try:
                return nx.read_graphml(str(path))
            except Exception as exc:
                raise HTTPException(
                    status_code=500, detail=f"Could not read graph: {exc}"
                )
    raise HTTPException(
        status_code=404,
        detail="Knowledge graph not found for this case. Upload and process documents first.",
    )


@router.get("/summary")
async def graph_summary(
    case_id: str,
    auth: AuthContext = Depends(get_current_user),
):
    """Return node/edge/entity-type summary for a case's knowledge graph."""
    await _verify_case_ownership(case_id=case_id, user_id=auth.user_id)
    ws    = UserWorkspace(user_id=auth.user_id, case_id=case_id)
    graph = _load_graph(ws)

    entity_types: dict = {}
    for _, node in graph.nodes(data=True):
        etype = node.get("entity_type", "UNKNOWN").replace('"', "")
        entity_types[etype] = entity_types.get(etype, 0) + 1

    return {
        "case_id":      case_id,
        "nodes":        graph.number_of_nodes(),
        "edges":        graph.number_of_edges(),
        "entity_types": entity_types,
    }


@router.get("/entities")
async def entities(
    case_id: str,
    limit: int = 100,
    auth: AuthContext = Depends(get_current_user),
):
    """Return entities from a case's knowledge graph."""
    await _verify_case_ownership(case_id=case_id, user_id=auth.user_id)
    ws    = UserWorkspace(user_id=auth.user_id, case_id=case_id)
    graph = _load_graph(ws)

    return [
        {
            "name":        node_name,
            "type":        node.get("entity_type", "UNKNOWN"),
            "description": node.get("description", ""),
        }
        for node_name, node in list(graph.nodes(data=True))[:limit]
    ]


@router.get("/relationships")
async def relationships(
    case_id: str,
    limit: int = 100,
    auth: AuthContext = Depends(get_current_user),
):
    """Return relationships from a case's knowledge graph."""
    await _verify_case_ownership(case_id=case_id, user_id=auth.user_id)
    ws    = UserWorkspace(user_id=auth.user_id, case_id=case_id)
    graph = _load_graph(ws)

    return [
        {
            "source":      source,
            "target":      target,
            "description": edge.get("description", ""),
            "weight":      edge.get("weight", 1),
        }
        for source, target, edge in list(graph.edges(data=True))[:limit]
    ]
