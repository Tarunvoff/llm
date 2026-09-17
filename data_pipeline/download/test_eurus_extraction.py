import re
import json
from datasets import load_dataset

def parse_eurus_response(gpt_text):
    output_idx = gpt_text.rfind('[OUTPUT]')
    if output_idx != -1:
        reasoning_raw = gpt_text[:output_idx]
        output_raw = gpt_text[output_idx + len('[OUTPUT]'):]
    else:
        reasoning_raw = gpt_text
        output_raw = gpt_text
    
    clean_reasoning = re.sub(r'\[(ASSESS|ADVANCE|VERIFY|SIMPLIFY|SYNTHESIZE|PIVOT|OUTPUT)\]', '', reasoning_raw).strip()
    
    # Extract boxed from OUTPUT section
    match = re.findall(r'\\boxed\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', output_raw)
    if not match:
        match = re.findall(r'boxed\{([^{}]*)\}', output_raw)
    
    final_ans = match[-1].strip() if match else output_raw.strip()
    return clean_reasoning, final_ans, output_raw

print("Streaming 50 Eurus-2 rows to test [OUTPUT] isolation and tag stripping...", flush=True)
ds = load_dataset('PRIME-RL/Eurus-2-SFT-Data', split='train', streaming=True)
count = 0
boxed_found = 0

for i, row in enumerate(ds):
    if count >= 50:
        break
    convs = row.get('conversations', [])
    if len(convs) < 2:
        continue
    gpt_text = convs[1]['value']
    q_text = convs[0]['value']
    clean_r, final_ans, out_raw = parse_eurus_response(gpt_text)
    
    if count < 5:
        row_id = row.get('id')
        print(f"=== SAMPLE {count+1} (ID: {row_id}) ===", flush=True)
        print(f"Question: {q_text[:120]}...", flush=True)
        print(f"Clean reasoning (tags stripped): {clean_r[:150]}...", flush=True)
        print(f"Extracted final answer from [OUTPUT]: {repr(final_ans)}", flush=True)
        print("", flush=True)
    if final_ans and len(final_ans) < 150:
        boxed_found += 1
    count += 1

print(f"Tested {count} rows. Successfully extracted clean [OUTPUT] final answer: {boxed_found}/{count}", flush=True)
