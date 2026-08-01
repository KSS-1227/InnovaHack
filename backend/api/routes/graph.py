"""
Graph API

FastAPI wrapper around the existing visualization module.

This module DOES NOT implement graph logic.

It simply exposes graph information in a FastAPI-friendly way.
"""

from fastapi import APIRouter, HTTPException
import networkx as nx

from backend.config import settings

router = APIRouter(
    prefix="/graph",
    tags=["Knowledge Graph"]
)


def _load_graph():

    graph_path = (
        settings.OUTPUT_DIR +
        f"/{settings.MMKG_NAME}.graphml"
    )

    try:
        return nx.read_graphml(graph_path)

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Knowledge graph not found."
        )


@router.get("/summary")
async def graph_summary():

    graph = _load_graph()

    entity_types = {}

    for _, node in graph.nodes(data=True):

        entity = (
            node.get(
                "entity_type",
                "UNKNOWN"
            )
            .replace('"', "")
        )

        entity_types[entity] = (
            entity_types.get(entity, 0) + 1
        )

    return {

        "nodes": graph.number_of_nodes(),

        "edges": graph.number_of_edges(),

        "entity_types": entity_types

    }


@router.get("/entities")
async def entities(limit: int = 100):

    graph = _load_graph()

    response = []

    for node_name, node in list(graph.nodes(data=True))[:limit]:

        response.append({

            "name": node_name,

            "type": node.get(
                "entity_type",
                "UNKNOWN"
            ),

            "description": node.get(
                "description",
                ""
            )

        })

    return response


@router.get("/relationships")
async def relationships(limit: int = 100):

    graph = _load_graph()

    response = []

    for source, target, edge in list(
        graph.edges(data=True)
    )[:limit]:

        response.append({

            "source": source,

            "target": target,

            "description": edge.get(
                "description",
                ""
            ),

            "weight": edge.get(
                "weight",
                1
            )

        })

    return response