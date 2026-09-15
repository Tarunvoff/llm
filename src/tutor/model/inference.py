"""Inference and Text Generation Engine.

Handles text generation from base and LoRA-adapted causal language models
with customizable decoding parameters and structured prompting.
"""

from dataclasses import dataclass, field
import logging
from typing import Any, Dict, List, Optional

import torch
from transformers import GenerationConfig, PreTrainedModel, PreTrainedTokenizer

logger = logging.getLogger(__name__)


@dataclass
class TutorGenerationConfig:
    """Generation parameters for pedagogical tutoring responses."""

    max_new_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    repetition_penalty: float = 1.1
    do_sample: bool = True
    pad_token_id: Optional[int] = None
    eos_token_id: Optional[int] = None
    stop_strings: List[str] = field(default_factory=lambda: ["<|endoftext|>", "<|im_end|>"])

    def to_generation_config(self, tokenizer: PreTrainedTokenizer) -> GenerationConfig:
        """Converts to Hugging Face GenerationConfig."""
        pad_id = self.pad_token_id if self.pad_token_id is not None else tokenizer.pad_token_id
        eos_id = self.eos_token_id if self.eos_token_id is not None else tokenizer.eos_token_id

        return GenerationConfig(
            max_new_tokens=self.max_new_tokens,
            temperature=self.temperature if self.do_sample else 1.0,
            top_p=self.top_p if self.do_sample else 1.0,
            top_k=self.top_k if self.do_sample else 0,
            repetition_penalty=self.repetition_penalty,
            do_sample=self.do_sample,
            pad_token_id=pad_id,
            eos_token_id=eos_id,
        )


class TutorGenerator:
    """Wraps model and tokenizer to provide convenient pedagogical inference."""

    def __init__(
        self,
        model: PreTrainedModel,
        tokenizer: PreTrainedTokenizer,
        default_config: Optional[TutorGenerationConfig] = None,
    ):
        self.model = model
        self.tokenizer = tokenizer
        self.default_config = default_config or TutorGenerationConfig()

    def generate(
        self,
        prompt: str,
        config: Optional[TutorGenerationConfig] = None,
    ) -> str:
        """Generates a text completion for a prompt.

        Args:
            prompt: Text prompt or formatted chat string.
            config: Optional override generation config.

        Returns:
            Generated response string.
        """
        gen_cfg = config or self.default_config
        hf_gen_cfg = gen_cfg.to_generation_config(self.tokenizer)

        inputs = self.tokenizer(prompt, return_tensors="pt")
        device = next(self.model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}

        prompt_len = inputs["input_ids"].shape[1]

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                generation_config=hf_gen_cfg,
            )

        # Slice out prompt tokens to return only the newly generated response
        generated_tokens = output_ids[0, prompt_len:]
        response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
        return response

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[TutorGenerationConfig] = None,
    ) -> str:
        """Formats chat messages using the tokenizer's chat template and generates response."""
        if hasattr(self.tokenizer, "apply_chat_template"):
            prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        else:
            # Fallback format if chat template is not defined
            prompt = ""
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                prompt += f"<|im_start|>{role}\n{content}<|im_end|>\n"
            prompt += "<|im_start|>assistant\n"

        return self.generate(prompt=prompt, config=config)
