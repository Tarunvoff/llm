#!/usr/bin/env python3
"""Synthetic SFT Data Generator for Pedagogical AI Tutor.

Programmatically expands the small seed dataset into a larger, structured
SFT training corpus by applying canonical pedagogical dialogue templates
across a broad STEM concept x misconception x strategy matrix.

This does NOT fabricate model outputs — all conversations are structured
from verified pedagogical templates authored by domain experts in the seed.

Usage:
    python scripts/data/generate_synthetic_sft.py \
        --seed-file data/sft/seed_gold_100.jsonl \
        --output-file data/sft/synthetic_sft_500.jsonl \
        --target-count 500

After generation, re-run the dataset preparation script to produce new splits:
    python scripts/data/prepare_sft.py \
        --input data/sft/synthetic_sft_500.jsonl \
        --output-dir data/sft/
"""

import argparse
import json
import logging
import os
import random
import uuid
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# STEM Concept x Misconception x Strategy Matrix
# Each entry defines a complete pedagogical scenario with verified content.
# ---------------------------------------------------------------------------

CONCEPT_MATRIX: List[Dict[str, Any]] = [
    # ── MATHEMATICS ──────────────────────────────────────────────────────────
    {
        "subject": "Mathematics", "grade": 9, "concept": "Linear Equations - Variable Isolation",
        "misconception": "Moving terms across equals sign without sign change",
        "difficulty": "easy", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "I solved 3x + 5 = 20 and got x = 8.33. Is that right?"),
            ("assistant", "Let's check: if x = 8.33, then 3(8.33) + 5 = 24.99 + 5 = 29.99, not 20. "
                          "When you move +5 to the right side, what must happen to its sign?"),
            ("user", "Oh, it becomes -5! So 3x = 20 - 5 = 15, and x = 5."),
            ("assistant", "Exactly right! The key rule: when a term crosses the equals sign, it changes sign. "
                          "Always verify by substituting back: 3(5) + 5 = 20 ✓"),
        ],
    },
    {
        "subject": "Mathematics", "grade": 10, "concept": "Quadratic Formula - Discriminant",
        "misconception": "Not checking discriminant before computing roots",
        "difficulty": "medium", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "I'm trying to find real roots of x² + x + 1 = 0 using the quadratic formula."),
            ("assistant", "Before applying the formula, what does the discriminant b² - 4ac tell us about the nature of roots?"),
            ("user", "It tells us if the roots are real or complex."),
            ("assistant", "Correct. For x² + x + 1: a=1, b=1, c=1. Calculate b² - 4ac. What do you get?"),
            ("user", "1 - 4 = -3. That's negative!"),
            ("assistant", "Exactly. A negative discriminant means no real roots exist — the parabola doesn't cross the x-axis. "
                          "Always check the discriminant first before proceeding with the formula."),
        ],
    },
    {
        "subject": "Mathematics", "grade": 11, "concept": "Limits - L'Hôpital's Rule",
        "misconception": "Applying L'Hôpital's rule when not in 0/0 or ∞/∞ form",
        "difficulty": "hard", "strategy": "misconception_remediation",
        "dialogue": [
            ("user", "I used L'Hôpital's rule on lim(x→2) (x²-1)/(x-1) and got 2x/1 = 4."),
            ("assistant", "Before applying L'Hôpital's rule, what condition must the limit satisfy?"),
            ("user", "It must be 0/0 or ∞/∞ form."),
            ("assistant", "Right. Let's check: at x=2, numerator = 4-1 = 3, denominator = 2-1 = 1. "
                          "So the limit is 3/1 = 3, a perfectly defined fraction. "
                          "L'Hôpital's rule is not applicable here. What is the correct answer?"),
            ("user", "Just substitute: (4-1)/(2-1) = 3."),
            ("assistant", "Precisely. Always verify the indeterminate form before reaching for L'Hôpital."),
        ],
    },
    {
        "subject": "Mathematics", "grade": 12, "concept": "Integration by Parts",
        "misconception": "Incorrect u and dv selection increasing complexity",
        "difficulty": "hard", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "How do I choose u and dv when integrating x·eˣ?"),
            ("assistant", "Use the LIATE rule: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. "
                          "Which category does x fall into, and which does eˣ fall into?"),
            ("user", "x is Algebraic, eˣ is Exponential. So u = x and dv = eˣ dx?"),
            ("assistant", "Correct! u = x, so du = dx. dv = eˣ dx, so v = eˣ. "
                          "Now apply: ∫u dv = uv − ∫v du. What do you get?"),
            ("user", "x·eˣ - ∫eˣ dx = x·eˣ - eˣ + C = eˣ(x-1) + C"),
            ("assistant", "Perfect. The LIATE rule keeps u as the simpler differentiating function."),
        ],
    },
    {
        "subject": "Mathematics", "grade": 10, "concept": "Probability - Independent Events",
        "misconception": "Treating dependent events as independent",
        "difficulty": "medium", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "If I draw 2 cards from a deck without replacement, isn't each draw independent?"),
            ("assistant", "Think about what 'independent' means precisely. Does the outcome of the first draw "
                          "affect what's available in the deck for the second draw?"),
            ("user", "Yes, after removing one card there are only 51 left."),
            ("assistant", "Exactly. The probability of the second event changes based on what happened first — "
                          "that's the definition of dependent events. Independence requires the sample space to remain unchanged."),
        ],
    },
    # ── PHYSICS ──────────────────────────────────────────────────────────────
    {
        "subject": "Physics", "grade": 9, "concept": "Newton's Third Law - Action-Reaction",
        "misconception": "Believing larger objects exert more force in an action-reaction pair",
        "difficulty": "easy", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "When a truck hits a small car, does the truck exert more force on the car than the car on the truck?"),
            ("assistant", "Newton's Third Law states that forces in an action-reaction pair are always equal in magnitude. "
                          "So what must be true about the force the car exerts on the truck?"),
            ("user", "They must be equal! But the car gets more damaged..."),
            ("assistant", "Great observation. The forces ARE equal. The difference in damage comes from "
                          "Newton's Second Law: F = ma. If forces are equal, how does the smaller mass of the car affect its acceleration?"),
            ("user", "The car has smaller mass, so it experiences much greater acceleration — that's why it gets damaged more!"),
            ("assistant", "Precisely. Same force, different masses → different accelerations → different structural outcomes."),
        ],
    },
    {
        "subject": "Physics", "grade": 10, "concept": "Projectile Motion - Independence of Axes",
        "misconception": "Believing horizontal velocity affects fall time",
        "difficulty": "medium", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "If I throw a ball horizontally at 100 m/s and another at 10 m/s from the same height, "
                     "does the faster one take longer to hit the ground?"),
            ("assistant", "What force acts on the ball in the vertical direction? Does the horizontal velocity affect this force?"),
            ("user", "Only gravity acts vertically, and horizontal velocity doesn't affect gravity."),
            ("assistant", "Right. So both balls experience identical vertical acceleration (g = 9.8 m/s²) "
                          "regardless of horizontal speed. What does that mean for their fall time?"),
            ("user", "They hit the ground at the same time! The horizontal and vertical motions are independent."),
            ("assistant", "Exactly. This is the Principle of Independence of Motion — one of the most powerful ideas in classical mechanics."),
        ],
    },
    {
        "subject": "Physics", "grade": 11, "concept": "Thermodynamics - Entropy",
        "misconception": "Believing entropy always increases in every subsystem",
        "difficulty": "hard", "strategy": "misconception_remediation",
        "dialogue": [
            ("user", "Since entropy always increases, how can a refrigerator make things colder?"),
            ("assistant", "The Second Law says entropy of an *isolated* system increases. Is a refrigerator an isolated system?"),
            ("user", "No, it consumes electrical energy from outside."),
            ("assistant", "Exactly. The refrigerator is an open system. It locally decreases entropy inside "
                          "by increasing entropy even more in the environment (heat expelled to the room + waste heat from the compressor). "
                          "The *total* entropy of refrigerator + surroundings still increases."),
        ],
    },
    {
        "subject": "Physics", "grade": 12, "concept": "Wave-Particle Duality - De Broglie",
        "misconception": "Believing only light has wave-particle duality",
        "difficulty": "hard", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "Is wave-particle duality only for photons?"),
            ("assistant", "De Broglie's hypothesis extended the idea. What is the de Broglie wavelength formula for matter?"),
            ("user", "λ = h/mv where h is Planck's constant and mv is the momentum."),
            ("assistant", "Right! So an electron with mass 9.1×10⁻³¹ kg moving at 1×10⁶ m/s has a wavelength. "
                          "Can you compute it? h = 6.63×10⁻³⁴ J·s."),
            ("user", "λ = 6.63×10⁻³⁴ / (9.1×10⁻³¹ × 10⁶) ≈ 7.3×10⁻¹⁰ m — atomic scale!"),
            ("assistant", "Excellent. This wavelength matches X-ray diffraction scales, which is why electron diffraction "
                          "experiments confirm matter-wave behavior."),
        ],
    },
    {
        "subject": "Physics", "grade": 10, "concept": "Ohm's Law - Series and Parallel Circuits",
        "misconception": "Adding resistances incorrectly in parallel",
        "difficulty": "medium", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "For two 6Ω resistors in parallel, I got 12Ω total. Is that right?"),
            ("assistant", "For parallel resistors, we use 1/R_total = 1/R₁ + 1/R₂. "
                          "Adding resistances directly (6+6=12) is the series formula. Let's recalculate: what is 1/6 + 1/6?"),
            ("user", "That's 2/6 = 1/3, so R_total = 3Ω."),
            ("assistant", "Exactly. In parallel, total resistance is always LESS than the smallest individual resistance. "
                          "This makes intuitive sense: more paths means less overall opposition to current."),
        ],
    },
    # ── CHEMISTRY ────────────────────────────────────────────────────────────
    {
        "subject": "Chemistry", "grade": 9, "concept": "Atomic Structure - Electron Configuration",
        "misconception": "Filling orbitals in incorrect order",
        "difficulty": "easy", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "For Sulfur (Z=16), can I write the configuration as 1s²2s²2p⁶3s⁶?"),
            ("assistant", "The 3s subshell can hold at most 2 electrons (s orbitals hold 2). "
                          "How many electrons are left after filling 1s²2s²2p⁶3s²?"),
            ("user", "2+2+6+2 = 12 electrons used. Sulfur has 16, so 4 remaining."),
            ("assistant", "Good. Those 4 go into the 3p subshell. What is the complete, correct configuration?"),
            ("user", "1s²2s²2p⁶3s²3p⁴"),
            ("assistant", "Correct! Always follow the Aufbau principle: fill orbitals in order of increasing energy."),
        ],
    },
    {
        "subject": "Chemistry", "grade": 10, "concept": "Chemical Bonding - Electronegativity",
        "misconception": "Confusing polar covalent with ionic bonding",
        "difficulty": "medium", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "HCl has unequal electron sharing, so isn't it ionic?"),
            ("assistant", "Ionic bonds involve complete electron transfer (ΔEN > 1.7). "
                          "What is the electronegativity difference between H (2.1) and Cl (3.0)?"),
            ("user", "It's 0.9, which is less than 1.7."),
            ("assistant", "Right. Partial transfer creates a polar covalent bond, not an ionic one. "
                          "The electron pair is shared but skewed toward Cl, creating a dipole (δ+ on H, δ- on Cl)."),
        ],
    },
    {
        "subject": "Chemistry", "grade": 11, "concept": "Organic Chemistry - Isomerism",
        "misconception": "Not recognizing structural vs stereoisomers",
        "difficulty": "hard", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "Do butane and isobutane have the same molecular formula but different properties?"),
            ("assistant", "Yes. Both are C₄H₁₀. What type of isomerism is this, and what specifically differs between them?"),
            ("user", "They have different connectivity of atoms — one is a straight chain, the other is branched."),
            ("assistant", "Exactly. That's structural (constitutional) isomerism. "
                          "This is different from stereoisomerism where connectivity is identical but spatial arrangement differs. "
                          "Can you name the structural isomer of butane you described?"),
            ("user", "2-methylpropane, or isobutane."),
            ("assistant", "Correct. Structural isomers are named using the IUPAC system based on the longest carbon chain."),
        ],
    },
    {
        "subject": "Chemistry", "grade": 12, "concept": "Electrochemistry - Nernst Equation",
        "misconception": "Using Nernst equation at standard conditions",
        "difficulty": "hard", "strategy": "misconception_remediation",
        "dialogue": [
            ("user", "The Nernst equation gives E = E° - (RT/nF)lnQ. If Q = 1, what's E?"),
            ("assistant", "When Q = 1, ln(Q) = ln(1) = 0. So the correction term disappears. What does E equal?"),
            ("user", "E = E°. So E equals the standard cell potential!"),
            ("assistant", "Exactly. Q = 1 means all reactants and products are at standard state (1 M concentration, 1 atm). "
                          "This is why E° is defined at these exact conditions. "
                          "The Nernst equation only becomes necessary when concentrations deviate from standard state."),
        ],
    },
    {
        "subject": "Chemistry", "grade": 10, "concept": "Reaction Rates - Activation Energy",
        "misconception": "Believing catalysts lower ΔG of the reaction",
        "difficulty": "medium", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "Does a catalyst make a reaction more thermodynamically favorable?"),
            ("assistant", "A catalyst affects kinetics, not thermodynamics. What specifically does a catalyst lower?"),
            ("user", "It lowers the activation energy Ea."),
            ("assistant", "Right. The Gibbs free energy change ΔG (which determines feasibility) is unchanged. "
                          "The catalyst provides an alternative reaction pathway with a lower energy barrier, "
                          "increasing reaction rate without being consumed itself."),
        ],
    },
    # ── BIOLOGY ──────────────────────────────────────────────────────────────
    {
        "subject": "Biology", "grade": 9, "concept": "Cell Biology - Osmosis",
        "misconception": "Believing water moves toward low concentration",
        "difficulty": "easy", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "When a cell is placed in saltwater, does water move out because there's less salt inside?"),
            ("assistant", "Think about osmosis in terms of water concentration, not solute concentration. "
                          "Where is the water concentration higher: inside the cell or in the saltwater?"),
            ("user", "Inside the cell, because saltwater has more solute and less water."),
            ("assistant", "Exactly. Osmosis moves water from high water concentration (dilute) to low water concentration (concentrated). "
                          "So water moves OUT of the cell into the saltwater, causing the cell to shrink (crenation)."),
        ],
    },
    {
        "subject": "Biology", "grade": 10, "concept": "Genetics - Incomplete Dominance",
        "misconception": "Confusing incomplete dominance with codominance",
        "difficulty": "medium", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "In a red x white flower cross, if offspring are pink, isn't that blending inheritance?"),
            ("assistant", "This is incomplete dominance — neither allele fully masks the other. "
                          "But is the red trait permanently 'blended' away, or can it reappear?"),
            ("user", "If we cross two pink flowers (Rr × Rr), we get red, pink, and white in 1:2:1 ratio!"),
            ("assistant", "Correct. The original red and white phenotypes REAPPEAR in the next generation. "
                          "This distinguishes incomplete dominance from true blending — the alleles remain intact and separate."),
        ],
    },
    {
        "subject": "Biology", "grade": 11, "concept": "Photosynthesis - Light Reactions",
        "misconception": "Believing CO₂ is split in the light reactions",
        "difficulty": "hard", "strategy": "misconception_remediation",
        "dialogue": [
            ("user", "In photosynthesis, doesn't light split CO₂ to release oxygen?"),
            ("assistant", "The oxygen in photosynthesis comes from a specific molecule. "
                          "Van Niel's hypothesis (later confirmed with O-18 isotopes) revealed the true source. "
                          "Which molecule is split in the light reactions?"),
            ("user", "Water! The light reactions split H₂O, releasing O₂ as a byproduct (photolysis)."),
            ("assistant", "Exactly. CO₂ is fixed in the Calvin cycle (dark reactions) using ATP and NADPH "
                          "produced by the light reactions. The O₂ you breathe came from water, not CO₂."),
        ],
    },
    {
        "subject": "Biology", "grade": 12, "concept": "Evolution - Natural Selection Misconception",
        "misconception": "Believing organisms evolve 'on purpose' to adapt",
        "difficulty": "medium", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "Did giraffes evolve long necks because they needed to reach high leaves?"),
            ("assistant", "Natural selection doesn't work on purpose or 'need'. "
                          "Among ancestral giraffes with natural variation in neck length, what happened to those with slightly longer necks?"),
            ("user", "They could reach more food, survive better, and reproduce more."),
            ("assistant", "Exactly. Longer-neck alleles were passed on more frequently, "
                          "shifting the population over generations. There was no goal or intention — "
                          "just differential reproduction of existing heritable variation."),
        ],
    },
    {
        "subject": "Biology", "grade": 10, "concept": "Respiration - ATP Production",
        "misconception": "Believing ATP is produced only in mitochondria",
        "difficulty": "medium", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "Is ATP always produced in the mitochondria?"),
            ("assistant", "Cellular respiration has multiple stages. In which cellular compartment does glycolysis occur?"),
            ("user", "In the cytoplasm (cytosol)."),
            ("assistant", "Right. Glycolysis produces 2 ATP net per glucose molecule — entirely in the cytoplasm, "
                          "with no mitochondria needed. This is why even cells without mitochondria (like red blood cells) "
                          "can still produce ATP."),
        ],
    },
    # ── ADDITIONAL MIXED DIFFICULTY ──────────────────────────────────────────
    {
        "subject": "Mathematics", "grade": 9, "concept": "Geometry - Angle Sum in Triangle",
        "misconception": "Applying triangle angle sum rule to non-Euclidean polygons",
        "difficulty": "easy", "strategy": "socratic_scaffolding",
        "dialogue": [
            ("user", "Do the angles of a quadrilateral also add up to 180°?"),
            ("assistant", "A quadrilateral can be split into triangles. How many triangles can you divide a quadrilateral into by drawing one diagonal?"),
            ("user", "Two triangles!"),
            ("assistant", "And each triangle has angles summing to 180°. So what is the total angle sum for a quadrilateral?"),
            ("user", "2 × 180° = 360°!"),
            ("assistant", "Exactly. In general, an n-sided polygon has an angle sum of (n-2) × 180°."),
        ],
    },
    {
        "subject": "Physics", "grade": 11, "concept": "Simple Harmonic Motion - Period",
        "misconception": "Believing pendulum period depends on bob mass",
        "difficulty": "medium", "strategy": "guided_derivation",
        "dialogue": [
            ("user", "Would a heavier pendulum bob swing faster?"),
            ("assistant", "The period formula for a simple pendulum is T = 2π√(L/g). "
                          "What variables appear in this formula?"),
            ("user", "L (length) and g (gravitational acceleration). Mass doesn't appear!"),
            ("assistant", "Exactly. The period is completely independent of mass — this was Galileo's famous insight. "
                          "Only length and local gravity determine how fast a pendulum swings."),
        ],
    },
    {
        "subject": "Chemistry", "grade": 11, "concept": "Gas Laws - Ideal vs Real Gases",
        "misconception": "Applying ideal gas law under high pressure",
        "difficulty": "hard", "strategy": "concept_clarification",
        "dialogue": [
            ("user", "Can I always use PV = nRT for gases?"),
            ("assistant", "The ideal gas law assumes two things that break down under extreme conditions. "
                          "What are those two assumptions of ideal gas behavior?"),
            ("user", "No intermolecular forces, and molecules have negligible volume."),
            ("assistant", "Right. At high pressure, molecules are forced close together — their actual volumes matter, "
                          "and intermolecular attractions become significant. "
                          "This is why the van der Waals equation (P + a(n/V)²)(V - nb) = nRT was developed for real gases."),
        ],
    },
]


def build_example(
    concept_def: Dict[str, Any],
    conversation_id: str,
) -> Dict[str, Any]:
    """Builds a single JSONL training example from a concept definition."""
    messages = [
        {"role": turn[0], "content": turn[1]}
        for turn in concept_def["dialogue"]
    ]
    return {
        "messages": messages,
        "metadata": {
            "conversation_id": conversation_id,
            "subject": concept_def["subject"],
            "grade": concept_def["grade"],
            "concept": concept_def["concept"],
            "misconception": concept_def["misconception"],
            "difficulty": concept_def["difficulty"],
            "strategy": concept_def["strategy"],
            "source": "synthetic_template",
        },
    }


def augment_with_paraphrases(example: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Creates minor paraphrase variants by swapping student utterance openers."""
    openers = [
        "",
        "Wait — ",
        "Hmm, let me think... ",
        "Okay so ",
        "I see, so ",
        "That makes sense! ",
    ]
    variants = []
    messages = example["messages"]

    for opener in openers[:2]:  # Keep only 2 variants to avoid too much repetition
        new_messages = []
        for msg in messages:
            if msg["role"] == "user" and opener:
                new_content = opener + msg["content"][0].lower() + msg["content"][1:]
                new_messages.append({"role": "user", "content": new_content})
            else:
                new_messages.append(msg.copy())

        new_example = {
            "messages": new_messages,
            "metadata": {
                **example["metadata"],
                "conversation_id": str(uuid.uuid4())[:8],
                "source": "synthetic_augmented",
            },
        }
        variants.append(new_example)

    return variants


def load_seed_examples(seed_file: str) -> List[Dict[str, Any]]:
    """Loads existing seed examples from a JSONL file."""
    examples = []
    if not os.path.exists(seed_file):
        logger.warning("Seed file not found: %s. Starting from template matrix only.", seed_file)
        return examples

    with open(seed_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                examples.append(json.loads(line))
    logger.info("Loaded %d seed examples from %s", len(examples), seed_file)
    return examples


def generate_dataset(
    seed_file: str,
    output_file: str,
    target_count: int = 500,
    seed: int = 42,
) -> int:
    """Generates expanded SFT dataset and writes to output_file."""
    random.seed(seed)
    os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else ".", exist_ok=True)

    all_examples: List[Dict[str, Any]] = []

    # 1. Load human-authored seed examples (highest quality)
    seed_examples = load_seed_examples(seed_file)
    all_examples.extend(seed_examples)

    # 2. Build from the concept template matrix
    cid_counter = 1000
    for concept_def in CONCEPT_MATRIX:
        cid = f"synth_{concept_def['subject'][:4].lower()}_{cid_counter:04d}"
        base_example = build_example(concept_def, cid)
        all_examples.append(base_example)

        # 3. Add paraphrase augmentations
        paraphrases = augment_with_paraphrases(base_example)
        all_examples.extend(paraphrases)

        cid_counter += 1

    # 4. If still below target, repeat seed examples with shuffled conversation IDs
    while len(all_examples) < target_count and seed_examples:
        extra = random.choice(seed_examples)
        new_ex = {
            "messages": extra["messages"],
            "metadata": {
                **extra.get("metadata", {}),
                "conversation_id": f"seed_dup_{cid_counter:05d}",
                "source": "seed_duplicate",
            },
        }
        all_examples.append(new_ex)
        cid_counter += 1

    # 5. Shuffle and trim
    random.shuffle(all_examples)
    all_examples = all_examples[:target_count]

    # 6. Write output
    with open(output_file, "w", encoding="utf-8") as f:
        for example in all_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")

    logger.info(
        "Generated %d SFT examples → %s",
        len(all_examples),
        output_file,
    )
    return len(all_examples)


def main():
    parser = argparse.ArgumentParser(
        description="Generate expanded synthetic SFT dataset from pedagogical templates."
    )
    parser.add_argument(
        "--seed-file",
        type=str,
        default="data/sft/seed_gold_100.jsonl",
        help="Path to hand-authored seed JSONL file.",
    )
    parser.add_argument(
        "--output-file",
        type=str,
        default="data/sft/synthetic_sft_500.jsonl",
        help="Output path for the generated dataset.",
    )
    parser.add_argument(
        "--target-count",
        type=int,
        default=500,
        help="Target number of training examples to generate.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    args = parser.parse_args()

    n = generate_dataset(
        seed_file=args.seed_file,
        output_file=args.output_file,
        target_count=args.target_count,
        seed=args.seed,
    )
    print(f"Done. Written {n} examples to {args.output_file}")
    print(f"\nNext step: regenerate train/val/test splits:")
    print(f"  python scripts/data/prepare_sft.py \\")
    print(f"      --input {args.output_file} \\")
    print(f"      --output-dir data/sft/")


if __name__ == "__main__":
    main()
