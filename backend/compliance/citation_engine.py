"""
Citation Engine

Enterprise Compliance Intelligence Platform

Purpose
-------
Convert pre-computed GraphRAG retrieval context into citable evidence.

Receives retrieval context already produced by GraphRAGQuery —
never performs similarity search itself.

Future Version
--------------
Will support:
- Exact PDF page numbers
- Bounding boxes
- Image references
- Table references
- Audio timestamps
"""

from typing import Dict, List, Tuple


class CitationEngine:

    def build_citations(
        self,
        retrieval_context: Dict,
        graph,
        text_chunks: Dict,
    ) -> List[Dict]:
        """
        Build citations from pre-computed retrieval context.

        Parameters
        ----------
        retrieval_context : dict
            The ``"retrieval"`` sub-dict from
            ``GraphRAGQuery.query(return_context=True)``.
        graph : networkx.Graph
            Loaded knowledge graph (``query_engine.graph``).
        text_chunks : dict
            KV store of text chunks (``query_engine.text_chunks``).

        Returns
        -------
        List[dict]  — deduplicated by source_chunk
        """

        similar_nodes: List[Tuple[str, float]] = retrieval_context.get(
            "similar_nodes", []
        )

        citations = []

        for node_name, similarity in similar_nodes:

            if node_name not in graph:
                continue

            node = graph.nodes[node_name]

            description = node.get("description", "")
            entity_type = node.get("entity_type", "UNKNOWN").replace('"', "")

            for sid in node.get("source_id", "").split("<SEP>"):
                sid = sid.strip()
                if not sid:
                    continue
                chunk = text_chunks.get(sid)
                if chunk is None:
                    continue
                citations.append({
                    "entity":      node_name,
                    "entity_type": entity_type,
                    "confidence":  round(similarity, 3),
                    "source_chunk": sid,
                    "excerpt":     chunk.get("content", "")[:350],
                    "description": description,
                })

        # Deduplicate by source_chunk — last writer wins (highest-scored
        # entity for that chunk, since similar_nodes is score-descending)
        unique: Dict[str, dict] = {}
        for citation in citations:
            unique[citation["source_chunk"]] = citation

        return list(unique.values())