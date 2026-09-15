"""Prerequisite Knowledge Graph represented as a Directed Acyclic Graph (DAG).

Models dependencies between concepts, identifies prerequisite gaps,
and selects optimal remediation sequences.
"""

from dataclasses import dataclass, field
import json
import logging
import os
from typing import Any, Dict, List, Optional, Set

import networkx as nx

logger = logging.getLogger(__name__)


@dataclass
class ConceptNode:
    """Represents an atomic educational concept within the curriculum."""

    concept_id: str
    name: str
    subject: str = "Mathematics"
    grade: int = 10
    difficulty: str = "medium"  # easy, medium, hard
    description: str = ""
    prerequisites: List[str] = field(default_factory=list)


class PrerequisiteGraph:
    """DAG managing pedagogical dependencies between concepts."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.concepts: Dict[str, ConceptNode] = {}

    def add_concept(self, concept: ConceptNode):
        """Adds a concept node to the knowledge graph."""
        self.concepts[concept.concept_id] = concept
        self.graph.add_node(concept.concept_id, data=concept)

        for prereq_id in concept.prerequisites:
            self.graph.add_edge(prereq_id, concept.concept_id)

        # Validate DAG acyclicity
        if not nx.is_directed_acyclic_graph(self.graph):
            self.graph.remove_node(concept.concept_id)
            del self.concepts[concept.concept_id]
            raise ValueError(f"Adding concept '{concept.concept_id}' creates a cycle in the prerequisite graph.")

    def get_direct_prerequisites(self, concept_id: str) -> List[str]:
        """Returns direct prerequisite concept IDs."""
        if concept_id not in self.graph:
            return []
        return list(self.graph.predecessors(concept_id))

    def get_all_ancestor_prerequisites(self, concept_id: str) -> Set[str]:
        """Returns all transitive prerequisite concept IDs."""
        if concept_id not in self.graph:
            return set()
        return nx.ancestors(self.graph, concept_id)

    def find_unmastered_prerequisites(
        self,
        concept_id: str,
        mastery_map: Dict[str, float],
        mastery_threshold: float = 0.85,
    ) -> List[str]:
        """Identifies any prerequisites whose mastery is below the threshold.

        Returns list in topological remediation order (foundations first).
        """
        if concept_id not in self.graph:
            return []

        ancestors = nx.ancestors(self.graph, concept_id)
        # Sort ancestors by topological sort
        topo_order = list(nx.topological_sort(self.graph))
        unmastered = [
            cid for cid in topo_order
            if cid in ancestors and mastery_map.get(cid, 0.0) < mastery_threshold
        ]
        return unmastered

    def get_recommended_next_concept(
        self,
        mastery_map: Dict[str, float],
        mastery_threshold: float = 0.85,
    ) -> Optional[str]:
        """Finds the next concept ready for learning whose prerequisites are all mastered."""
        for cid in nx.topological_sort(self.graph):
            if mastery_map.get(cid, 0.0) < mastery_threshold:
                # Check if all its direct prerequisites are mastered
                direct_prereqs = self.get_direct_prerequisites(cid)
                if all(mastery_map.get(p, 0.0) >= mastery_threshold for p in direct_prereqs):
                    return cid
        return None

    def save_graph(self, file_path: str):
        """Serializes prerequisite graph to JSON."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        data = {
            cid: {
                "concept_id": c.concept_id,
                "name": c.name,
                "subject": c.subject,
                "grade": c.grade,
                "difficulty": c.difficulty,
                "description": c.description,
                "prerequisites": c.prerequisites,
            }
            for cid, c in self.concepts.items()
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_graph(self, file_path: str):
        """Loads prerequisite graph from JSON."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Prerequisite graph not found at: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.graph.clear()
        self.concepts.clear()

        # Add concepts
        for cid, info in data.items():
            node = ConceptNode(
                concept_id=info["concept_id"],
                name=info["name"],
                subject=info.get("subject", "Mathematics"),
                grade=info.get("grade", 10),
                difficulty=info.get("difficulty", "medium"),
                description=info.get("description", ""),
                prerequisites=info.get("prerequisites", []),
            )
            self.add_concept(node)
