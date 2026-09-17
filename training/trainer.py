"""
Trainer Infrastructure Blueprint
Provides the architecture for future SFT / LoRA / RL (GRPO) training workflows.
"""

from typing import Dict, Any, Optional
from pathlib import Path


class ModelTrainer:
    """
    Modular training harness setup for future model adaptation.
    Wraps model loading, LoRA configuration, and training loop orchestration.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.training_enabled = config.get("status", {}).get("training_enabled", False)

    def prepare_lora_config(self) -> Dict[str, Any]:
        """Returns standard LoRA configuration dictionary matching model architecture."""
        lora_cfg = self.config.get("lora", {})
        return {
            "r": lora_cfg.get("r", 64),
            "lora_alpha": lora_cfg.get("lora_alpha", 128),
            "lora_dropout": lora_cfg.get("lora_dropout", 0.0),
            "target_modules": lora_cfg.get("target_modules", [
                "q_proj", "k_proj", "v_proj", "o_proj", "embed_tokens"
            ]),
            "bias": lora_cfg.get("bias", "none"),
            "task_type": lora_cfg.get("task_type", "CAUSAL_LM")
        }

    def initialize_trainer(self, train_sft_path: Optional[str] = None):
        """Initializes trainer components when training is enabled."""
        if not self.training_enabled:
            raise RuntimeError(
                "Training is disabled for this deployment stage. "
                "Update configs/training.yaml or use configs/vidhya2_sft.yaml."
            )
        from training.train_sft_vidhya import train_sft
        return train_sft

    def train(self, config_path: str = "configs/vidhya2_sft.yaml", dry_run: bool = False):
        """Training invocation hook for Vidhya 2.0 SFT."""
        from training.train_sft_vidhya import train_sft
        train_sft(config_path=config_path, dry_run=dry_run)
