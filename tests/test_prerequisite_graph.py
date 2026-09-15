"""Unit tests for Prerequisite Knowledge Graph."""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from tutor.bkt.prerequisite_graph import PrerequisiteGraph, ConceptNode


def test_prerequisite_graph_dag_and_cycle_rejection():
    graph = PrerequisiteGraph()

    c1 = ConceptNode(concept_id="algebra_basics", name="Algebra Basics")
    c2 = ConceptNode(concept_id="linear_eq", name="Linear Equations", prerequisites=["algebra_basics"])
    c3 = ConceptNode(concept_id="quad_eq", name="Quadratic Equations", prerequisites=["linear_eq"])

    graph.add_concept(c1)
    graph.add_concept(c2)
    graph.add_concept(c3)

    assert graph.get_direct_prerequisites("quad_eq") == ["linear_eq"]
    assert graph.get_all_ancestor_prerequisites("quad_eq") == {"linear_eq", "algebra_basics"}

    # Attempt to introduce a cycle (algebra_basics depending on quad_eq)
    c_cyclic = ConceptNode(concept_id="algebra_basics_rev", name="Algebra Cyclic", prerequisites=["quad_eq"])
    graph.add_concept(c_cyclic)
    # Re-adding algebra_basics with prerequisite quad_eq should trigger cycle rejection
    c_bad = ConceptNode(concept_id="algebra_basics", name="Bad Node", prerequisites=["algebra_basics_rev"])
    with pytest.raises(ValueError):
        graph.add_concept(c_bad)


def test_unmastered_prerequisite_detection():
    graph = PrerequisiteGraph()
    c1 = ConceptNode(concept_id="fractions", name="Fractions")
    c2 = ConceptNode(concept_id="linear_eq", name="Linear Equations", prerequisites=["fractions"])
    c3 = ConceptNode(concept_id="quad_eq", name="Quadratic Equations", prerequisites=["linear_eq"])

    graph.add_concept(c1)
    graph.add_concept(c2)
    graph.add_concept(c3)

    mastery_map = {
        "fractions": 0.40,  # Unmastered (< 0.85)
        "linear_eq": 0.70,  # Unmastered (< 0.85)
        "quad_eq": 0.20,
    }

    unmastered = graph.find_unmastered_prerequisites("quad_eq", mastery_map, mastery_threshold=0.85)
    # Must be in topological order: fractions first, then linear_eq
    assert unmastered == ["fractions", "linear_eq"]
