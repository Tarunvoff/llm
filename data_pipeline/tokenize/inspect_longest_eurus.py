import json
from pathlib import Path
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("model/aryabhata-2.0", trust_remote_code=True)
eurus_examples = []

for split in ["train.jsonl", "val.jsonl", "test.jsonl"]:
    p = Path("data/sft/v2_reasoning_boost") / split
    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            if "eurus" in r.get("source_dataset", "").lower():
                q = r.get("question", "")
                reasoning = r.get("reasoning_trace", "")
                ans = r.get("final_answer", "")
                full_seq = (
                    f"<|start|>system<|message|>You are Aryabhata, a large language model post trained by PhysicsWallah.\n"
                    f"Reasoning: auto\n\n# Valid channels: analysis, commentary, final. Channel must be included for every message.<|end|>"
                    f"<|start|>user<|message|>{q}<|end|>"
                    f"<|start|>assistant<|channel|>analysis<|message|>{reasoning}<|channel|>final<|message|>{ans}<|end|>"
                )
                length = len(tok.encode(full_seq, add_special_tokens=False))
                eurus_examples.append({
                    "example_id": r.get("example_id"),
                    "token_length": length,
                    "split": split,
                    "question": q,
                    "final_answer": ans
                })

eurus_examples.sort(key=lambda x: x["token_length"], reverse=True)
print(f"Total Eurus-2 examples: {len(eurus_examples)}")
print("\nTop 15 Longest Eurus-2 Examples:")
for i, ex in enumerate(eurus_examples[:15], 1):
    q_prev = " ".join(ex["question"].split())[:180]
    ans_prev = " ".join(ex["final_answer"].split())[:80]
    print(f"#{i:02d} | Tokens: {ex['token_length']:>7,} | ID: {ex['example_id']} | Split: {ex['split']}")
    print(f"     Question: {q_prev}...")
    print(f"     Answer:   {ans_prev}\n")
