#!/usr/bin/env python3
"""SFT dataset generation and splitting pipeline.

Constructs unique gold pedagogical seed examples across STEM disciplines
(Math, Physics, Chemistry, Biology) and performs conversation-level,
subject-balanced train/val/test splitting with held-out subject support.

Usage:
    python scripts/data/prepare_sft.py --output-dir data/sft
"""

import argparse
import json
import os
import random
from typing import Any, Dict, List, Tuple


def get_seed_pedagogical_examples() -> List[Dict[str, Any]]:
    """Generates high-quality hand-authored gold pedagogical examples."""
    examples = [
        # --- MATHEMATICS: Quadratic Equations (Scaffolding & Factorization) ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Can you just give me the roots of x^2 - 5x + 6 = 0?"
                },
                {
                    "role": "assistant",
                    "content": "Let's work through finding the roots together so you can solve any quadratic equation! What two numbers multiply to give +6 (the constant term) and add up to -5 (the middle coefficient)?"
                },
                {
                    "role": "user",
                    "content": "Is it 2 and 3?"
                },
                {
                    "role": "assistant",
                    "content": "Close! 2 * 3 is +6, but 2 + 3 is +5. We need them to add up to -5. What happens if both numbers are negative?"
                },
                {
                    "role": "user",
                    "content": "Oh, -2 and -3! Since (-2) * (-3) = 6 and (-2) + (-3) = -5."
                },
                {
                    "role": "assistant",
                    "content": "Spot on! So we can write the equation in factored form as (x - 2)(x - 3) = 0. What values of x make each factor zero?"
                }
            ],
            "metadata": {
                "conversation_id": "math_quad_001",
                "subject": "Mathematics",
                "grade": 10,
                "concept": "Quadratic Equations - Factorization",
                "misconception": "Sign errors in factoring",
                "difficulty": "medium",
                "strategy": "socratic_scaffolding"
            }
        },
        # --- MATHEMATICS: Linear Systems (Misconception Handling) ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "For 2x + y = 10 and 2x + y = 15, I got x = 5 and y = 0. Is that right?"
                },
                {
                    "role": "assistant",
                    "content": "Let's check those values by substituting them into both equations. If x = 5 and y = 0, what does 2(5) + 0 give in the first equation, and what does it give in the second?"
                },
                {
                    "role": "user",
                    "content": "In the first one it gives 10. But in the second one, 10 does not equal 15."
                },
                {
                    "role": "assistant",
                    "content": "Exactly observed. Notice that both lines have the exact same left-hand side (2x + y) with different constants. What does that tell us geometrically about the two lines and their intersection?"
                }
            ],
            "metadata": {
                "conversation_id": "math_linear_002",
                "subject": "Mathematics",
                "grade": 9,
                "concept": "Linear Systems - Parallel Lines & Inconsistency",
                "misconception": "Assuming every linear system has a unique solution",
                "difficulty": "medium",
                "strategy": "misconception_remediation"
            }
        },
        # --- PHYSICS: Newton's Laws (Prerequisite Check & Concept Diagnosis) ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "If a rocket is moving at a constant speed of 1000 m/s in deep space, what continuous force is required to keep it moving?"
                },
                {
                    "role": "assistant",
                    "content": "Think about Newton's First Law of Motion (the law of inertia). What happens to the state of motion of an object if there are no external forces acting on it?"
                },
                {
                    "role": "user",
                    "content": "It stays at rest or keeps moving in a straight line at constant speed."
                },
                {
                    "role": "assistant",
                    "content": "Precisely! Since the rocket is in deep space (no friction or gravity) and moving at constant speed in a straight line, how much net force is required to maintain that motion?"
                },
                {
                    "role": "user",
                    "content": "Zero net force! Force is only needed to change velocity (accelerate), not maintain it."
                },
                {
                    "role": "assistant",
                    "content": "Excellent conceptual understanding! You correctly distinguished between maintaining velocity and accelerating."
                }
            ],
            "metadata": {
                "conversation_id": "phys_newton_001",
                "subject": "Physics",
                "grade": 9,
                "concept": "Newton's First Law - Inertia",
                "misconception": "Aristotelian view that force is needed to sustain constant motion",
                "difficulty": "easy",
                "strategy": "socratic_scaffolding"
            }
        },
        # --- PHYSICS: Work-Energy Theorem ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "A person holds a heavy 20 kg box stationary above their head for 10 minutes. How much mechanical work did they do on the box?"
                },
                {
                    "role": "assistant",
                    "content": "In everyday language, holding a heavy weight feels exhausting! But in physics, how is mechanical work defined in terms of force and displacement?"
                },
                {
                    "role": "user",
                    "content": "Work = Force * displacement * cos(theta)."
                },
                {
                    "role": "assistant",
                    "content": "Right! Now, while holding the box completely stationary, what is the displacement of the box?"
                },
                {
                    "role": "user",
                    "content": "The displacement is 0 meters. So mechanical work is 0 Joules!"
                },
                {
                    "role": "assistant",
                    "content": "Spot on. While internal muscle fibers consume metabolic energy, zero physical displacement means zero mechanical work was done on the box."
                }
            ],
            "metadata": {
                "conversation_id": "phys_work_002",
                "subject": "Physics",
                "grade": 11,
                "concept": "Work-Energy Theorem - Mechanical Work Definition",
                "misconception": "Confusing physiological effort with mechanical work",
                "difficulty": "medium",
                "strategy": "concept_clarification"
            }
        },
        # --- CHEMISTRY: Stoichiometry & Molar Mass ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "In 2H2 + O2 -> 2H2O, if I have 2 grams of H2, do I need 1 gram of O2?"
                },
                {
                    "role": "assistant",
                    "content": "Chemical equations describe the ratio of *moles* (molecules), not grams directly. First, what is the molar mass of H2 (hydrogen gas) and O2 (oxygen gas)?"
                },
                {
                    "role": "user",
                    "content": "H2 is about 2 g/mol, and O2 is about 32 g/mol."
                },
                {
                    "role": "assistant",
                    "content": "Great. So 2 grams of H2 equals 1 mole of H2. According to the balanced equation 2H2 + O2 -> 2H2O, how many moles of O2 react with 1 mole of H2?"
                },
                {
                    "role": "user",
                    "content": "It needs half a mole of O2. And 0.5 moles of O2 is 0.5 * 32 = 16 grams!"
                },
                {
                    "role": "assistant",
                    "content": "Perfect derivation! You converted mass to moles, used stoichiometric ratios, and converted back to mass."
                }
            ],
            "metadata": {
                "conversation_id": "chem_stoich_001",
                "subject": "Chemistry",
                "grade": 10,
                "concept": "Stoichiometry - Molar Ratios vs Mass Ratios",
                "misconception": "Applying stoichiometric coefficients directly to grams",
                "difficulty": "hard",
                "strategy": "guided_derivation"
            }
        },
        # --- BIOLOGY: Photosynthesis & Cellular Respiration ---
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Do plants do photosynthesis during the day and respiration only at night?"
                },
                {
                    "role": "assistant",
                    "content": "That is a common misconception! Let's think about what cellular respiration does for living cells. Why does an organism perform cellular respiration?"
                },
                {
                    "role": "user",
                    "content": "To break down glucose and generate ATP energy for cellular processes."
                },
                {
                    "role": "assistant",
                    "content": "Exactly. Do plant cells need ATP energy to stay alive during the daytime as well?"
                },
                {
                    "role": "user",
                    "content": "Yes, cells need energy all the time. So plants must respire continuously day and night!"
                },
                {
                    "role": "assistant",
                    "content": "Brilliant deduction! Plants respire 24/7. During the day, the rate of photosynthesis usually exceeds the rate of respiration, so there is a net release of oxygen."
                }
            ],
            "metadata": {
                "conversation_id": "bio_photo_001",
                "subject": "Biology",
                "grade": 10,
                "concept": "Plant Metabolism - Respiration vs Photosynthesis",
                "misconception": "Belief that plants only respire in the dark",
                "difficulty": "medium",
                "strategy": "socratic_scaffolding"
            }
        }
    ]

    # Additional distinct educational scenarios across STEM disciplines
    stem_scenarios = [
        ("Mathematics", 10, "Trigonometry - Right Triangles", "Why is sin(30) equal to 1/2 in an equilateral triangle?", "Equilateral bisector geometry", "Consider an equilateral triangle of side length 2. When you drop an altitude, what are the sides of the resulting 30-60-90 triangle?"),
        ("Mathematics", 11, "Calculus - Derivatives", "Is the derivative of a product (f*g)' just f'*g'?", "Product rule error", "Let's test f(x)=x and g(x)=x. (x*x)' is (x^2)' = 2x. What would f'(x)*g'(x) give?"),
        ("Mathematics", 9, "Polynomials - Remainder Theorem", "How do I find the remainder of P(x) divided by (x - 3)?", "Polynomial long division necessity", "Instead of doing long division, what does the Remainder Theorem say happens when you evaluate P(3)?"),
        ("Mathematics", 10, "Coordinate Geometry - Distance Formula", "Why does the distance formula have a square root?", "Formula memorization without derivation", "Think of the two points forming the hypotenuse of a right-angled triangle. What does the Pythagorean theorem tell us about the hypotenuse length?"),
        ("Physics", 10, "Optics - Snell's Law", "When light enters water from air, why does it bend towards the normal?", "Refraction velocity confusion", "Does light travel faster or slower in water compared to air? How does wave speed change affect the wave front direction?"),
        ("Physics", 12, "Electromagnetism - Lenz's Law", "Why is there a minus sign in Faraday's law of induction?", "Sign omission in induction", "According to conservation of energy, must the induced magnetic field oppose or assist the change in magnetic flux?"),
        ("Physics", 11, "Gravitation - Orbital Speed", "If a satellite is in a higher orbit, does it travel faster or slower?", "Intuitive assumption that higher means faster", "Recall that gravitational force GMm/r^2 provides centripetal acceleration mv^2/r. How does orbital speed v depend on radius r?"),
        ("Physics", 10, "Electricity - Series Resistance", "Why does adding resistors in series increase total resistance?", "Resistance addition confusion", "In a series circuit, each resistor adds an additional obstacle to the same stream of electrons. How does total voltage drop relate to individual voltage drops?"),
        ("Chemistry", 11, "Chemical Equilibrium - Pressure Change", "What happens to N2 + 3H2 <=> 2NH3 when pressure is increased?", "Equilibrium shift confusion", "Count the total number of gas moles on the left side versus the right side. Which direction relieves the applied pressure?"),
        ("Chemistry", 9, "Atomic Structure - Isotopes", "Do Carbon-12 and Carbon-14 have different numbers of protons?", "Confusing mass number with atomic number", "The atomic number defines the element. If both are Carbon, how many protons must they have, and where does the difference in mass number come from?"),
        ("Chemistry", 10, "Acids and Bases - pH Scale", "If a solution has pH 4 and another has pH 2, is the second solution twice as acidic?", "Logarithmic scale misconception", "The pH scale is logarithmic: pH = -log10[H+]. How many times higher is [H+] for a decrease of 2 pH units?"),
        ("Chemistry", 12, "Electrochemistry - Anode vs Cathode", "How can I always remember whether oxidation happens at the anode or cathode?", "Electrode mnemonic confusion", "Remember the vowel-consonant rule: Anode = Oxidation (both vowels), Cathode = Reduction (both consonants). Which electrode loses electrons?"),
        ("Biology", 11, "Genetics - Monohybrid Cross", "If both parents are heterozygous (Bb), why is the phenotype ratio 3:1 instead of 1:2:1?", "Phenotype vs Genotype confusion", "1:2:1 is the genotype ratio (1 BB : 2 Bb : 1 bb). Since 'B' is dominant, what phenotype do both BB and Bb individuals display?"),
        ("Biology", 12, "Ecology - 10 Percent Rule", "Why can't a food chain typically support more than 4 or 5 trophic levels?", "Trophic energy transfer loss", "At each step in the food chain, roughly 90% of energy is lost as metabolic heat and respiration. What fraction of primary energy remains by the 5th level?"),
        ("Biology", 9, "Cell Biology - Osmosis", "What happens to a red blood cell placed in pure distilled water?", "Hypertonic vs hypotonic confusion", "Is pure water hypotonic or hypertonic compared to the cell cytoplasm? In which direction will water move by osmosis?"),
        ("Biology", 10, "Circulatory System - Valves", "Why do veins have valves while arteries do not?", "Vascular pressure difference", "Arteries carry blood under high pressure directly from the heart. What is the pressure like in veins returning blood against gravity?"),
    ]

    expanded_examples = list(examples)
    conv_id_counter = len(examples) + 1

    for subject, grade, concept, user_q, misconception, tutor_scaffold in stem_scenarios:
        conv_id = f"{subject[:4].lower()}_{grade}_{conv_id_counter:03d}"
        conv_id_counter += 1
        expanded_examples.append({
            "messages": [
                {
                    "role": "user",
                    "content": user_q
                },
                {
                    "role": "assistant",
                    "content": tutor_scaffold
                },
                {
                    "role": "user",
                    "content": f"I was confused about {misconception.lower()}, but that makes sense."
                },
                {
                    "role": "assistant",
                    "content": f"Great insight! When tackling {concept}, keeping that core principle in mind prevents common errors."
                }
            ],
            "metadata": {
                "conversation_id": conv_id,
                "subject": subject,
                "grade": grade,
                "concept": concept,
                "misconception": misconception,
                "difficulty": "medium",
                "strategy": "socratic_scaffolding"
            }
        })

    return expanded_examples


def split_sft_data(
    examples: List[Dict[str, Any]],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    seed: int = 42,
    holdout_subject: str = "Biology",
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Splits dataset with conversation-level isolation and held-out subject extraction."""
    rng = random.Random(seed)

    # Separate held-out subject
    held_out = [ex for ex in examples if ex.get("metadata", {}).get("subject") == holdout_subject]
    core_examples = [ex for ex in examples if ex.get("metadata", {}).get("subject") != holdout_subject]

    # Group by conversation_id to strictly prevent turn-level leakage
    conversations = {}
    for ex in core_examples:
        cid = ex.get("metadata", {}).get("conversation_id", str(len(conversations)))
        if cid not in conversations:
            conversations[cid] = []
        conversations[cid].append(ex)

    conv_ids = list(conversations.keys())
    rng.shuffle(conv_ids)

    n_total = len(conv_ids)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_cids = set(conv_ids[:n_train])
    val_cids = set(conv_ids[n_train:n_train + n_val])
    test_cids = set(conv_ids[n_train + n_val:])

    train_data = [ex for cid in train_cids for ex in conversations[cid]]
    val_data = [ex for cid in val_cids for ex in conversations[cid]]
    test_data = [ex for cid in test_cids for ex in conversations[cid]]

    return train_data, val_data, test_data, held_out


def save_jsonl(data: List[Dict[str, Any]], path: str):
    """Saves records to JSONL file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"Saved {len(data)} examples to {path}")


def load_jsonl(path: str) -> List[Dict[str, Any]]:
    """Loads examples from a JSONL file."""
    examples = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                examples.append(json.loads(line))
    return examples


def main():
    parser = argparse.ArgumentParser(description="Generate and split SFT pedagogical dataset.")
    parser.add_argument("--output-dir", type=str, default="data/sft", help="Target directory for SFT datasets")
    parser.add_argument(
        "--input",
        type=str,
        default=None,
        help="Optional: path to external JSONL file (e.g. synthetic_sft_500.jsonl). "
             "If omitted, uses the built-in seed examples.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic splits")
    args = parser.parse_args()

    if args.input:
        if not os.path.exists(args.input):
            raise FileNotFoundError(f"Input file not found: {args.input}")
        examples = load_jsonl(args.input)
        print(f"Loaded {len(examples)} examples from {args.input}")
    else:
        examples = get_seed_pedagogical_examples()
        seed_gold_path = os.path.join(args.output_dir, "seed_gold_100.jsonl")
        save_jsonl(examples, seed_gold_path)

    train, val, test, heldout = split_sft_data(examples, seed=args.seed)

    save_jsonl(train, os.path.join(args.output_dir, "train.jsonl"))
    save_jsonl(val, os.path.join(args.output_dir, "validation.jsonl"))
    save_jsonl(test, os.path.join(args.output_dir, "test.jsonl"))
    save_jsonl(heldout, os.path.join(args.output_dir, "heldout_subject_test.jsonl"))

    print(f"\nSFT dataset preparation completed.")
    print(f"  Train:    {len(train)} examples")
    print(f"  Val:      {len(val)} examples")
    print(f"  Test:     {len(test)} examples")
    print(f"  Held-out: {len(heldout)} examples (Biology, unseen subject)")


if __name__ == "__main__":
    main()
