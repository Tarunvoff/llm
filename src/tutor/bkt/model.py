"""Deterministic Bayesian Knowledge Tracing (BKT) Engine.

Explicitly models latent knowledge state transitions and observation probabilities:
- P(L0): Prior initial mastery probability
- P(T):  Transition probability (learning rate)
- P(G):  Guess probability (answering correctly despite no mastery)
- P(S):  Slip probability (answering incorrectly despite mastery)

Strict Architectural Invariant:
Mastery state updates are strictly deterministic and computed via Bayes' rule.
The language model never writes or mutates mastery values directly.
"""

from dataclasses import dataclass
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class BKTParameters:
    """Standard 4-parameter BKT configuration for a concept."""

    p_init: float = 0.10      # P(L0)
    p_transit: float = 0.15   # P(T)
    p_guess: float = 0.20     # P(G)
    p_slip: float = 0.10      # P(S)
    mastery_threshold: float = 0.85
    remediation_threshold: float = 0.50

    def validate(self):
        """Ensures all probabilities lie within valid bounds."""
        for name, val in [
            ("p_init", self.p_init),
            ("p_transit", self.p_transit),
            ("p_guess", self.p_guess),
            ("p_slip", self.p_slip),
            ("mastery_threshold", self.mastery_threshold),
            ("remediation_threshold", self.remediation_threshold),
        ]:
            if not 0.0 <= val <= 1.0:
                raise ValueError(f"BKT parameter '{name}' must be in [0, 1], got {val}")
        if self.p_guess + self.p_slip >= 1.0:
            logger.warning("P(G) + P(S) >= 1.0 may lead to degenerate knowledge updates.")


class BKTModel:
    """Deterministic BKT updater implementing standard Bayesian inference."""

    def __init__(self, default_params: Optional[BKTParameters] = None):
        self.default_params = default_params or BKTParameters()
        self.default_params.validate()
        self.concept_params: Dict[str, BKTParameters] = {}

    def set_concept_parameters(self, concept_id: str, params: BKTParameters):
        """Assigns concept-specific BKT parameters."""
        params.validate()
        self.concept_params[concept_id] = params

    def get_parameters(self, concept_id: Optional[str] = None) -> BKTParameters:
        """Retrieves parameters for a concept or falls back to default."""
        if concept_id and concept_id in self.concept_params:
            return self.concept_params[concept_id]
        return self.default_params

    def update_mastery(
        self,
        current_p_mastery: float,
        is_correct: bool,
        concept_id: Optional[str] = None,
    ) -> float:
        """Computes posterior mastery probability after observing a response.

        Formulas:
            If observation = Correct (1):
                P(L_t | obs=1) = (P(L_{t-1}) * (1 - S)) / (P(L_{t-1}) * (1 - S) + (1 - P(L_{t-1})) * G)
            If observation = Incorrect (0):
                P(L_t | obs=0) = (P(L_{t-1}) * S) / (P(L_{t-1}) * S + (1 - P(L_{t-1})) * (1 - G))

            Transition update (Learning step):
                P(L_{t+1}) = P(L_t | obs) + (1 - P(L_t | obs)) * T
        """
        params = self.get_parameters(concept_id)
        p_l = max(0.0, min(1.0, current_p_mastery))
        p_t = params.p_transit
        p_g = params.p_guess
        p_s = params.p_slip

        if is_correct:
            numerator = p_l * (1.0 - p_s)
            denominator = numerator + ((1.0 - p_l) * p_g)
        else:
            numerator = p_l * p_s
            denominator = numerator + ((1.0 - p_l) * (1.0 - p_g))

        # Safeguard against division by zero
        if denominator == 0:
            p_posterior = p_l
        else:
            p_posterior = numerator / denominator

        # Apply transition (learning opportunity)
        p_next = p_posterior + ((1.0 - p_posterior) * p_t)
        return float(max(0.0, min(1.0, p_next)))

    def is_mastered(self, p_mastery: float, concept_id: Optional[str] = None) -> bool:
        """Checks if current mastery exceeds the mastery threshold."""
        params = self.get_parameters(concept_id)
        return p_mastery >= params.mastery_threshold

    def needs_remediation(self, p_mastery: float, concept_id: Optional[str] = None) -> bool:
        """Checks if current mastery falls below the remediation threshold."""
        params = self.get_parameters(concept_id)
        return p_mastery < params.remediation_threshold
