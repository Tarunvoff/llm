import sys
import traceback
from datasets import load_dataset, get_dataset_config_names

test_ids = [
    '169Pi/exambench',
    'farhananis005/jee-sft-v1',
    'nvidia/OpenMathReasoning',
    'openlifescienceai/medmcqa',
    'camel-ai/physics',
    'camel-ai/chemistry',
    'camel-ai/math',
    'camel-ai/biology',
    'PRIME-RL/Eurus-2-SFT-Data'
]

for hf_id in test_ids:
    print(f"==================================================", flush=True)
    print(f"DATASET: {hf_id}", flush=True)
    print(f"==================================================", flush=True)
    try:
        configs = get_dataset_config_names(hf_id)
        print(f"Configs: {configs}", flush=True)
    except Exception as e:
        print(f"Configs query error: {type(e).__name__}: {e}", flush=True)
        configs = []

    try:
        cfg = configs[0] if configs and len(configs) > 0 else None
        print(f"Attempting load with config: {cfg} (streaming=True)...", flush=True)
        if cfg and cfg != "default":
            ds = load_dataset(hf_id, cfg, split="train", streaming=True)
        else:
            ds = load_dataset(hf_id, split="train", streaming=True)
        sample = next(iter(ds))
        print(f"SUCCESS! Sample keys: {list(sample.keys())}", flush=True)
        print(f"Sample preview: {str(sample)[:200]}...", flush=True)
    except Exception as e:
        print(f"LOAD ERROR: {type(e).__name__}: {e}", flush=True)
    print("", flush=True)
