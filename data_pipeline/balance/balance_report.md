# Vidhya 2.0 SFT Dataset Balance & Distribution Report

**Total Clean Decontaminated Examples Audited**: `416,325`

---
## 1. Subject × Difficulty Distribution Matrix

| Subject | JEE_ADVANCED | JEE_MAIN | NEET | OLYMPIAD | **Total** | **% of Pool** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Biology** | 0 | 0 | 201,471 | 0 | **201,471** | **48.4%** |
| **Chemistry** | 0 | 2,828 | 0 | 0 | **2,828** | **0.7%** |
| **Math** | 170,118 | 566 | 0 | 40,826 | **211,510** | **50.8%** |
| **Physics** | 0 | 516 | 0 | 0 | **516** | **0.1%** |
| **TOTAL** | **170,118** | **3,910** | **201,471** | **40,826** | **416,325** | **100.0%** |

---
## 2. Overall Source Dataset Representation

| Source Dataset | Clean Rows | % of Pool | Subject Coverage | Primary Reasoning Format |
| :--- | :---: | :---: | :--- | :--- |
| `openlifescienceai/medmcqa` | 180,925 | 43.5% | Biology | MCQ + Concise Explanation |
| `PRIME-RL/Eurus-2-SFT-Data` | 170,118 | 40.9% | Math | Multi-tag Structured CoT |
| `nvidia/OpenMathReasoning` | 40,826 | 9.8% | Math | Formal Competition Proof CoT |
| `FreedomIntelligence/medical-o1-reasoning-SFT` | 20,546 | 4.9% | Biology | Clinical Multi-Turn CoT |
| `Abc8264/Jee-Chemistry-dataset-with-COT` | 2,339 | 0.6% | Chemistry | Full CoT Chain |
| `eQOURSE/jee-main-questions` | 1,571 | 0.4% | Chemistry, Math, Physics | Full CoT Chain |

---
## 3. Subject-Level Source Composition

| Subject | Source Dataset | Rows | % of Subject | Reasoning Depth / Style |
| :--- | :--- | :---: | :---: | :--- |
| **Biology** | `openlifescienceai/medmcqa` | 180,925 | 89.8% | Concise MCQ Explanations |
| **Biology** | `FreedomIntelligence/medical-o1-reasoning-SFT` | 20,546 | 10.2% | Deep Multi-step Medical CoT |
| **Chemistry** | `Abc8264/Jee-Chemistry-dataset-with-COT` | 2,339 | 82.7% | Curated Indian Exam CoT |
| **Chemistry** | `eQOURSE/jee-main-questions` | 489 | 17.3% | Curated Indian Exam CoT |
| **Math** | `PRIME-RL/Eurus-2-SFT-Data` | 170,118 | 80.4% | Multi-step Reasoning Chains |
| **Math** | `nvidia/OpenMathReasoning` | 40,826 | 19.3% | Rigorous Olympiad/AIME Proofs |
| **Math** | `eQOURSE/jee-main-questions` | 566 | 0.3% | Curated Indian Exam CoT |
| **Physics** | `eQOURSE/jee-main-questions` | 516 | 100.0% | Curated Indian Exam CoT |

---
## 4. Source Retention & Deduplication Impact

| Source Dataset | Verified In | Exact Dropped | Semantic Dropped | Total Purged | Clean Kept | Retention Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `openlifescienceai/medmcqa` | 182,822 | 33 | 1,864 | 1,897 | **180,925** | **99.0%** |
| `PRIME-RL/Eurus-2-SFT-Data` | 180,679 | 8,530 | 1,495 | 10,025 | **170,654** | **94.5%** |
| `nvidia/OpenMathReasoning` | 46,313 | 5,371 | 81 | 5,452 | **40,861** | **88.2%** |
| `FreedomIntelligence/medical-o1-reasoning-SFT` | 43,635 | 23,022 | 66 | 23,088 | **20,547** | **47.1%** |
| `Abc8264/Jee-Chemistry-dataset-with-COT` | 2,339 | 0 | 0 | 0 | **2,339** | **100.0%** |
| `eQOURSE/jee-main-questions` | 1,652 | 66 | 14 | 80 | **1,572** | **95.2%** |

---
## 5. Distribution Quality & Representation Warnings

### ⚠️ Underrepresented Subjects (<5% of pool):
- **Chemistry**: `2,828` rows (0.68%) — *Recommendation: Subject cap or upweighting required to avoid domain atrophy.*
- **Physics**: `516` rows (0.12%) — *Recommendation: Subject cap or upweighting required to avoid domain atrophy.*

✅ **No single source dominates > 60% of the dataset**.

---
*Report generated automatically by Vidhya 2.0 Dataset Pipeline.*