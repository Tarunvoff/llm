# Pedagogical Tutor LLM

An adaptive educational tutor built using Qwen3, supervised fine-tuning,
Direct Preference Optimization (DPO), Retrieval-Augmented Generation (RAG),
and Bayesian Knowledge Tracing (BKT).

## Architecture

- Qwen3: pedagogical response generation
- SFT: teaching behavior alignment
- DPO: preference optimization
- RAG: factual/domain knowledge retrieval
- BKT: learner knowledge estimation and next-step selection

## Training Pipeline

Raw Data
→ Dataset Preparation
→ QLoRA + SFT
→ Evaluation
→ DPO
→ Evaluation
→ Final Model

## Runtime Pipeline

Learner State
→ BKT
→ RAG
→ Pedagogical Strategy
→ Qwen3
→ Tutor Response

## Models

- Qwen3-4B
- Qwen3-27B

## Project Status

Initial project setup.
