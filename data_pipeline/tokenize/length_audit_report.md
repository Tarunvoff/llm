# Aryabhata 2.0 Token-Length Distribution Audit Report

**Total Sequences Audited**: `11,344` across `D:\LLM_Project\llm\data\sft\v2_reasoning_boost`

---
## 1. Token Length Percentiles by Subject

| Subject | Count | Min | P50 (Median) | P90 | P95 | P99 | Max |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Biology** | 4,000 | 81 | 518 | 875 | **971** | 1265 | 2079 |
| **Chemistry** | 2,828 | 62 | 297 | 455 | **555** | 907 | 1927 |
| **Math** | 4,000 | 337 | 2802 | 12033 | **14063** | 16649 | 137896 |
| **Physics** | 516 | 67 | 179 | 347 | **396** | 511 | 769 |
| **TOTAL (All Subjects)** | **11,344** | 62 | 591 | 6582 | **10519** | 15395 | **137896** |

---
## 2. Sequence Length Threshold Exceedance

| Subject | Total Count | > 2,048 Tokens | % > 2,048 | > 4,096 Tokens | % > 4,096 | > 8,192 Tokens | % > 8,192 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Biology** | 4,000 | 1 | 0.03% | 0 | 0.00% | 0 | 0.00% |
| **Chemistry** | 2,828 | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| **Math** | 4,000 | 2,460 | 61.50% | 1,627 | 40.67% | 859 | 21.48% |
| **Physics** | 516 | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| **TOTAL** | **11,344** | **2,461** | **21.69%** | **1,627** | **14.34%** | **859** | **7.57%** |

---
## 3. Longest Outlier Examples by Subject

| Subject | Token Length | Source Dataset | Example ID | Split | Question Preview |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **Biology** | `2,079` | `FreedomIntelligence/medical-o1-reasoning-SFT` | `src_FreedomIntelligence__medical-o1-reasoning-SFT_4623` | `train.jsonl` | Using the Müller method, perform two iterations to approximate the root of the equation x^3 - 1/2 = 0, starting with ini... |
| **Chemistry** | `1,927` | `Abc8264/Jee-Chemistry-dataset-with-COT` | `src_Abc8264__Jee-Chemistry-dataset-with-COT_1584` | `train.jsonl` | <p>The concentration of dissolved Oxygen in water for growth of fish should be more than $$\mathrm{\underline X }$$ ppm ... |
| **Math** | `137,896` | `PRIME-RL/Eurus-2-SFT-Data` | `src_PRIME-RL__Eurus-2-SFT-Data_225783` | `train.jsonl` | The RSA encryption algorithm operates on the following principles:
Two distinct prime numbers, $p$ and $q$, are generate... |
| **Physics** | `769` | `eQOURSE/jee-main-questions` | `src_eQOURSE__jee-main-questions_2055` | `train.jsonl` | A system undergoes three quasi-static processes sequentially as
indicated in the given figure. $1 \rightarrow 2$is an is... |

---
*Audit completed in 29.12s using Aryabhata 2.0 tokenizer.*