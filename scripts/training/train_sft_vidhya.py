#!/usr/bin/env python3
"""
Entrypoint for Vidhya 2.0 Reasoning SFT Fine-Tuning.
Calls training/train_sft_vidhya.py.
"""
import os
import sys

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from training.train_sft_vidhya import main

if __name__ == "__main__":
    main()
