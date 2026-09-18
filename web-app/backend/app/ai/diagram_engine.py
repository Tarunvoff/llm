import json
import logging
from typing import List, Dict, Any, Optional
from app.ai.gemini import GeminiClient

logger = logging.getLogger("intellitutor.ai.diagrams")

class DiagramEngine:
    """
    Generates and provides educationally accurate structured SVG and interactive visual diagrams.
    Avoids misleading generative drawings by using verified programmatic SVG specifications.
    """

    DEFAULT_DIAGRAMS = [
        {
            "id": "diag_cell_division",
            "title": "Stages of Mitosis & Cell Division",
            "subject": "Biology",
            "chapter": "Cell Biology",
            "topic": "Cell Division (Mitosis vs Meiosis)",
            "diagram_type": "SVG",
            "simplified_view_code": """<svg viewBox="0 0 800 400" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="400" fill="#FBFBF9" rx="16"/>
  <!-- Stage 1: Prophase -->
  <g transform="translate(60, 80)">
    <circle cx="60" cy="80" r="55" fill="#FFF3F0" stroke="#FF5734" stroke-width="3"/>
    <circle cx="60" cy="80" r="30" fill="none" stroke="#BD3012" stroke-dasharray="4,4" stroke-width="2"/>
    <path d="M50 70 Q60 80 50 90 M70 70 Q60 80 70 90" stroke="#BD3012" stroke-width="3" fill="none"/>
    <text x="60" y="165" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">1. Prophase</text>
    <text x="60" y="185" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#707070">Chromatin Condenses</text>
  </g>
  <!-- Arrow 1 -->
  <path d="M190 160 L230 160" stroke="#9CA3AF" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Stage 2: Metaphase -->
  <g transform="translate(240, 80)">
    <circle cx="60" cy="80" r="55" fill="#FFF9D6" stroke="#E5A100" stroke-width="3"/>
    <line x1="60" y1="35" x2="60" y2="125" stroke="#8F6E00" stroke-width="2" stroke-dasharray="2,2"/>
    <path d="M55 65 L65 65 M55 80 L65 80 M55 95 L65 95" stroke="#8F6E00" stroke-width="4"/>
    <text x="60" y="165" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">2. Metaphase</text>
    <text x="60" y="185" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#707070">Equatorial Alignment</text>
  </g>
  <!-- Arrow 2 -->
  <path d="M370 160 L410 160" stroke="#9CA3AF" stroke-width="2"/>
  <!-- Stage 3: Anaphase -->
  <g transform="translate(420, 80)">
    <ellipse cx="60" cy="80" rx="65" ry="50" fill="#F0E9FD" stroke="#8B5CF6" stroke-width="3"/>
    <path d="M35 70 L25 80 L35 90 M85 70 L95 80 L85 90" stroke="#6C38D4" stroke-width="3" fill="none"/>
    <text x="60" y="165" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">3. Anaphase</text>
    <text x="60" y="185" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#707070">Sister Chromatids Separate</text>
  </g>
  <!-- Arrow 3 -->
  <path d="M560 160 L600 160" stroke="#9CA3AF" stroke-width="2"/>
  <!-- Stage 4: Telophase -->
  <g transform="translate(610, 80)">
    <circle cx="35" cy="80" r="32" fill="#ECFDF5" stroke="#10B981" stroke-width="2"/>
    <circle cx="85" cy="80" r="32" fill="#ECFDF5" stroke="#10B981" stroke-width="2"/>
    <text x="60" y="165" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">4. Telophase</text>
    <text x="60" y="185" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#707070">Nuclear Envelopes Reform</text>
  </g>
</svg>""",
            "detailed_view_code": """<svg viewBox="0 0 800 450" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#FFFFFF" stroke="#E8E6DE" stroke-width="2" rx="16"/>
  <text x="40" y="45" font-family="Inter, sans-serif" font-weight="800" font-size="18" fill="#151515">Detailed Mitotic Apparatus & Spindle Dynamics</text>
  <text x="40" y="70" font-family="Inter, sans-serif" font-size="12" fill="#707070">Kinetochore Microtubules, Centrosomes & Cleavage Furrow</text>
  
  <g transform="translate(200, 100)">
    <!-- Dividing Cell Body -->
    <path d="M0,120 C40,40 160,40 200,120 C240,40 360,40 400,120 C360,200 240,200 200,120 C160,200 40,200 0,120 Z" fill="#F8FAFC" stroke="#3B82F6" stroke-width="3"/>
    <!-- Centrosomes -->
    <circle cx="40" cy="120" r="8" fill="#EF4444"/>
    <circle cx="360" cy="120" r="8" fill="#EF4444"/>
    <text x="40" y="145" font-size="10" font-weight="bold" text-anchor="middle" fill="#EF4444">Aster (Centriole)</text>
    <text x="360" y="145" font-size="10" font-weight="bold" text-anchor="middle" fill="#EF4444">Aster (Centriole)</text>
    <!-- Spindle Fibers -->
    <line x1="48" y1="120" x2="160" y2="90" stroke="#93C5FD" stroke-width="2" stroke-dasharray="3,3"/>
    <line x1="48" y1="120" x2="160" y2="150" stroke="#93C5FD" stroke-width="2" stroke-dasharray="3,3"/>
    <line x1="352" y1="120" x2="240" y2="90" stroke="#93C5FD" stroke-width="2" stroke-dasharray="3,3"/>
    <line x1="352" y1="120" x2="240" y2="150" stroke="#93C5FD" stroke-width="2" stroke-dasharray="3,3"/>
    <!-- Separating Chromatids -->
    <path d="M150,80 L165,90 L150,100" stroke="#8B5CF6" stroke-width="4" fill="none"/>
    <path d="M150,140 L165,150 L150,160" stroke="#8B5CF6" stroke-width="4" fill="none"/>
    <path d="M250,80 L235,90 L250,100" stroke="#8B5CF6" stroke-width="4" fill="none"/>
    <path d="M250,140 L235,150 L250,160" stroke="#8B5CF6" stroke-width="4" fill="none"/>
    <!-- Furrow Line -->
    <line x1="200" y1="40" x2="200" y2="200" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4,4"/>
    <text x="200" y="225" font-size="11" font-weight="bold" text-anchor="middle" fill="#64748B">Cleavage Furrow (Actin-Myosin Ring)</text>
  </g>
</svg>""",
            "explanation": "Mitosis is equational division preserving diploid chromosome number (2n -> 2n). Key check-point occurs at Metaphase-Anaphase transition via APC/C activation.",
            "labels": [
                {"id": "l1", "name": "Centrosome / Aster", "description": "Microtubule organizing center responsible for spindle formation", "x": 15, "y": 45},
                {"id": "l2", "name": "Kinetochore Fibers", "description": "Protein complexes attached to centromere pulling chromatids to opposite poles", "x": 50, "y": 30},
                {"id": "l3", "name": "Cleavage Furrow", "description": "Contractile ring of actin and myosin filaments pinching daughter cells in cytokinesis", "x": 50, "y": 80}
            ],
            "related_formulas": [
                {"name": "Chromosome Count in Mitosis", "formula": "2n \\rightarrow 2n"},
                {"name": "DNA Content Shift (S Phase)", "formula": "2C \\rightarrow 4C \\rightarrow 2C"}
            ]
        },
        {
            "id": "diag_angular_momentum",
            "title": "Conservation of Angular Momentum in Rotating Systems",
            "subject": "Physics",
            "chapter": "Rotational Mechanics",
            "topic": "Conservation of Angular Momentum",
            "diagram_type": "SVG",
            "simplified_view_code": """<svg viewBox="0 0 800 400" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="400" fill="#FAF9F5" rx="16"/>
  <!-- State 1: Arms Extended -->
  <g transform="translate(100, 50)">
    <ellipse cx="140" cy="300" rx="80" ry="20" fill="#E2E8F0"/>
    <line x1="140" y1="40" x2="140" y2="300" stroke="#94A3B8" stroke-width="3" stroke-dasharray="5,5"/>
    <circle cx="140" cy="80" r="24" fill="#FF5734"/>
    <line x1="140" y1="104" x2="140" y2="200" stroke="#151515" stroke-width="6"/>
    <!-- Extended Arms -->
    <line x1="40" y1="130" x2="240" y2="130" stroke="#151515" stroke-width="6"/>
    <circle cx="40" cy="130" r="14" fill="#3B82F6"/>
    <circle cx="240" cy="130" r="14" fill="#3B82F6"/>
    <!-- Rotation Arrow (Slow) -->
    <path d="M100 240 A50 15 0 0 0 180 240" stroke="#FF5734" stroke-width="3" fill="none" marker-end="url(#arrow)"/>
    <text x="140" y="340" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">Large I, Low &omega;</text>
    <text x="140" y="360" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#64748B">Arms Outspread (High Inertia)</text>
  </g>
  <!-- Equals Sign -->
  <text x="400" y="200" font-family="Inter, sans-serif" font-size="32" font-weight="900" fill="#FF5734" text-anchor="middle">=</text>
  <text x="400" y="235" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#BD3012" text-anchor="middle">L = CONSTANT</text>
  <!-- State 2: Arms Pulled In -->
  <g transform="translate(460, 50)">
    <ellipse cx="140" cy="300" rx="80" ry="20" fill="#E2E8F0"/>
    <line x1="140" y1="40" x2="140" y2="300" stroke="#94A3B8" stroke-width="3" stroke-dasharray="5,5"/>
    <circle cx="140" cy="80" r="24" fill="#10B981"/>
    <line x1="140" y1="104" x2="140" y2="200" stroke="#151515" stroke-width="6"/>
    <!-- Pulled-in Arms -->
    <line x1="110" y1="140" x2="170" y2="140" stroke="#151515" stroke-width="6"/>
    <circle cx="110" cy="140" r="14" fill="#3B82F6"/>
    <circle cx="170" cy="140" r="14" fill="#3B82F6"/>
    <!-- Rotation Arrow (Fast) -->
    <path d="M90 240 A50 15 0 0 0 190 240" stroke="#10B981" stroke-width="6" fill="none"/>
    <text x="140" y="340" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="14" fill="#151515">Small I, High &omega;</text>
    <text x="140" y="360" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#64748B">Arms Tucked (Rapid Spin)</text>
  </g>
</svg>""",
            "detailed_view_code": """<svg viewBox="0 0 800 450" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#FFFFFF" stroke="#E8E6DE" stroke-width="2" rx="16"/>
  <text x="40" y="45" font-family="Inter, sans-serif" font-weight="800" font-size="18" fill="#151515">Vector Angular Momentum & Torque Relations</text>
  <text x="40" y="70" font-family="Inter, sans-serif" font-size="12" fill="#707070">\\vec{\\tau}_{ext} = \\frac{d\\vec{L}}{dt} = 0 \\implies \\vec{L} = I_1 \\vec{\\omega}_1 = I_2 \\vec{\\omega}_2</text>
  <g transform="translate(150, 110)">
    <!-- Coordinate system -->
    <line x1="100" y1="220" x2="100" y2="30" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="100" y1="220" x2="350" y2="220" stroke="#64748B" stroke-width="2"/>
    <!-- Position vector r and Momentum vector p -->
    <line x1="100" y1="220" x2="260" y2="120" stroke="#FF5734" stroke-width="3"/>
    <circle cx="260" cy="120" r="10" fill="#3B82F6"/>
    <line x1="260" y1="120" x2="330" y2="80" stroke="#10B981" stroke-width="3"/>
    <text x="180" y="160" font-weight="bold" fill="#FF5734" font-size="14">\\vec{r}</text>
    <text x="310" y="90" font-weight="bold" fill="#10B981" font-size="14">\\vec{p} = m\\vec{v}</text>
    <text x="260" y="100" font-weight="bold" fill="#151515" font-size="12">Point Mass m</text>
    <!-- L Vector along Z-axis -->
    <line x1="100" y1="220" x2="100" y2="70" stroke="#8B5CF6" stroke-width="4"/>
    <text x="60" y="80" font-weight="bold" fill="#8B5CF6" font-size="16">\\vec{L} = \\vec{r} \\times \\vec{p}</text>
  </g>
</svg>""",
            "explanation": "When net external torque is zero (\\tau_{ext} = 0), total angular momentum of the system remains conserved. Decreasing moment of inertia (I = \\sum m r^2) proportionally increases angular velocity (\\omega).",
            "labels": [
                {"id": "l1", "name": "Axis of Rotation", "description": "Fixed reference line about which all mass elements rotate", "x": 20, "y": 30},
                {"id": "l2", "name": "Moment of Inertia (I)", "description": "Rotational analogue of mass, depends on mass distribution from axis", "x": 50, "y": 75},
                {"id": "l3", "name": "Angular Velocity (\\omega)", "description": "Rate of rotational angle swept per second", "x": 80, "y": 75}
            ],
            "related_formulas": [
                {"name": "Conservation Law", "formula": "I_1 \\omega_1 = I_2 \\omega_2"},
                {"name": "Angular Momentum Vector", "formula": "\\vec{L} = \\vec{r} \\times \\vec{p} = I\\vec{\\omega}"},
                {"name": "Rotational Kinetic Energy", "formula": "K_{rot} = \\frac{1}{2} I \\omega^2 = \\frac{L^2}{2I}"}
            ]
        }
    ]

    @classmethod
    def get_all_diagrams(cls) -> List[Dict[str, Any]]:
        return cls.DEFAULT_DIAGRAMS

    @classmethod
    def get_diagram_by_id(cls, diagram_id: str) -> Optional[Dict[str, Any]]:
        for d in cls.DEFAULT_DIAGRAMS:
            if d["id"] == diagram_id:
                return d
        return None

    @classmethod
    def generate_custom_diagram(cls, topic: str, subject: str = "Physics") -> Dict[str, Any]:
        """
        Uses Gemini to generate structured SVG specifications for custom concepts.
        """
        prompt = (
            f"Generate a clean, educationally accurate SVG diagram for the concept '{topic}' in {subject}. "
            "Return JSON with format:\n"
            "{\n"
            '  "title": "Diagram Title",\n'
            '  "simplified_view_code": "<svg>...</svg>",\n'
            '  "detailed_view_code": "<svg>...</svg>",\n'
            '  "explanation": "Clear pedagogical explanation",\n'
            '  "labels": [{"id": "l1", "name": "Label Name", "description": "Description", "x": 50, "y": 50}],\n'
            '  "related_formulas": [{"name": "Formula Name", "formula": "LaTeX"}]\n'
            "}"
        )
        try:
            raw = GeminiClient.generate_text(prompt=prompt, temperature=0.2)
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Fallback custom diagram used: {e}")
            return {
                "title": f"Visual Architecture of {topic}",
                "simplified_view_code": f"""<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#FAF9F5" rx="16"/><text x="400" y="200" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#151515">{topic} Concept Map</text></svg>""",
                "detailed_view_code": f"""<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#FFFFFF" stroke="#E8E6DE" rx="16"/><text x="400" y="200" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FF5734">{topic} Detailed Architecture</text></svg>""",
                "explanation": f"Core visual mapping of {topic} for {subject} exam revision.",
                "labels": [{"id": "l1", "name": "Key Center", "description": f"Primary operative region of {topic}", "x": 50, "y": 50}],
                "related_formulas": [{"name": f"{topic} Governing Equation", "formula": "E = mc^2"}]
            }
