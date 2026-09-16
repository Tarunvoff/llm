import React from 'react';
import vidhyaLogo from '../assets/vidhya_logo.png';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  GraduationCap, 
  Cpu, 
  Zap, 
  BookOpen, 
  BrainCircuit, 
  Calculator, 
  Atom, 
  Dna,
  Layers,
  ChevronRight
} from 'lucide-react';

interface HomeProps {
  setActivePage: (page: 'home' | 'about' | 'chat' | 'benchmarks') => void;
  onQuickPrompt?: (prompt: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActivePage, onQuickPrompt }) => {
  const [quickInput, setQuickInput] = React.useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onQuickPrompt?.(quickInput);
      setActivePage('chat');
    } else {
      setActivePage('chat');
    }
  };

  const handleCategoryClick = (category: string) => {
    const defaultPrompts: Record<string, string> = {
      Calculus: "Derive the step-by-step solution for ∫ e^(2x) · cos(3x) dx using integration by parts.",
      Physics: "Derive the relativistic kinetic energy formula E_k = (γ - 1)mc² from the work-energy theorem.",
      Chemistry: "Explain the SN1 vs SN2 reaction mechanism kinetics and stereochemical outcome with an example.",
      Biology: "Trace the ATP yield from aerobic cellular respiration through glycolysis and oxidative phosphorylation."
    };
    onQuickPrompt?.(defaultPrompts[category] || `Explain fundamental principles of ${category}`);
    setActivePage('chat');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* ====================================================================
          HERO SECTION (High Dopamine EdTech Layout)
          ==================================================================== */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        
        {/* Subtle Background Geometry */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-tr from-blue-100/40 via-brand-50/50 to-amber-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Editorial Copy */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Dopamine Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide shadow-sm">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                <span>Next-Gen STEM Reasoning Architecture</span>
                <span className="text-amber-600">★ 2026 Model Edition</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Getting Best Quality{' '}
                <span className="relative inline-block text-brand-600">
                  STEM Reasoning
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-400" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M1 5.5C40 2 120 2 199 5.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                Is Now More Easier.
              </h1>

              {/* Editorial Subtitle */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
                Vidhya 2.0 is an academic Mixture-of-Experts AI engine designed for Indian &amp; Global STEM competitive examinations. Socratic step-by-step guidance without hallucinations.
              </p>

              {/* Quick Inquiry Search Bar */}
              <form onSubmit={handleQuickSubmit} className="relative max-w-xl">
                <div className="flex items-center bg-white rounded-full p-1.5 shadow-lg shadow-slate-200/60 border border-slate-200 ring-4 ring-slate-100/50">
                  <div className="pl-4 pr-2 text-slate-400">
                    <Sparkles className="size-5 text-brand-600" />
                  </div>
                  <input
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="Search any concept (e.g. Wave Optics, Schrödinger Eq)..."
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm transition-all duration-150 active:scale-95 shadow-sm"
                  >
                    <span>Solve Now</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </form>

              {/* Key Trust Signals */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>JEE Adv. 2025: 86.51%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>64% Token Reduction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Zero Fluff Socratic Flow</span>
                </div>
              </div>

            </div>

            {/* Right Column: Vidhya Hero Character & Achievement Cards */}
            <div className="lg:col-span-5 relative flex justify-center">
              
              {/* Outer Decorative Rings */}
              <div className="relative w-full max-w-[420px] aspect-square rounded-3xl bg-gradient-to-tr from-brand-600/10 via-blue-500/5 to-amber-500/10 p-4 border border-slate-200/60 shadow-xl">
                
                {/* Character Card */}
                <div className="relative w-full h-full rounded-2xl bg-white overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                  <img
                    src={vidhyaLogo}
                    alt="Vidhya Official STEM Logo"
                    className="w-full h-full object-contain p-4 drop-shadow-md"
                  />

                  {/* Floating Achievement Sticker 1: JEE Advanced */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-lg flex items-center gap-3 animate-bounce duration-1000">
                    <div className="size-9 rounded-xl bg-blue-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                      JEE
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ranked #1 Benchmarks</div>
                      <div className="text-xs font-extrabold text-slate-900">86.51% Accuracy</div>
                    </div>
                  </div>

                  {/* Floating Achievement Sticker 2: Token Efficiency */}
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-lg flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token Efficiency</div>
                      <div className="text-xs font-extrabold text-slate-900">2,102 Avg Tokens</div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ====================================================================
          SOLID ROYAL BLUE STATS BANNER (Reference Visual)
          ==================================================================== */}
      <section className="bg-brand-600 text-white py-8 border-y border-brand-700 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-brand-500/40">
            
            <div className="pt-3 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">88.95%</div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">In-Distribution Average</div>
            </div>

            <div className="pt-3 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">2,102</div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Avg Tokens / Solution</div>
            </div>

            <div className="pt-3 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">42.31</div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Accuracy / 1K Tokens Ratio</div>
            </div>

            <div className="pt-3 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">20B MoE</div>
              <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Mixture-of-Experts Engine</div>
            </div>

          </div>
        </div>
      </section>


      {/* ====================================================================
          BROWSE STEM SUBJECTS SECTION
          ==================================================================== */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-600 text-xs font-extrabold uppercase tracking-wider mb-3">
              Specialized Curricula
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore STEM Subjects
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Trained on 45,000+ verified step-by-step problem sets across high-school and undergraduate levels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Subject 1: Mathematics */}
            <div 
              onClick={() => handleCategoryClick('Calculus')}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            >
              <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calculator className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Calculus &amp; Algebra
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Limits, differential equations, linear algebra, multivariable calculus, and complex analysis.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-brand-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Subject 2: Physics */}
            <div 
              onClick={() => handleCategoryClick('Physics')}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            >
              <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Atom className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Physics &amp; Mechanics
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Rotational dynamics, electrodynamics, quantum mechanics, wave optics, and thermodynamics.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-brand-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Subject 3: Chemistry */}
            <div 
              onClick={() => handleCategoryClick('Chemistry')}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            >
              <div className="size-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BrainCircuit className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Organic &amp; Physical
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Reaction mechanisms, coordination compounds, chemical kinetics, and electrochemistry.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-brand-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Subject 4: Biology */}
            <div 
              onClick={() => handleCategoryClick('Biology')}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            >
              <div className="size-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Dna className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Genetics &amp; Physiology
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Molecular biology, cellular energetics, genetics, human physiology, and ecology.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-brand-600 gap-1">
                <span>Start Practice</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ====================================================================
          CALL TO ACTION BANNER (Drive to Chat & Benchmarks)
          ==================================================================== */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-blue-400 border border-brand-500/30 text-xs font-semibold">
            <span>Powered by Vidhya 2.0 Reasoning Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to solve complex STEM problems?
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
            Experience the Bolt-style reasoning interface with model selectors, LaTeX typesetting, and zero hallucination.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActivePage('chat')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-lg shadow-brand-600/30 transition-all duration-150 active:scale-95"
            >
              <span>Launch Vidhya Chat</span>
              <ArrowRight className="size-5" />
            </button>

            <button
              onClick={() => setActivePage('benchmarks')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base border border-slate-700 transition-all duration-150 active:scale-95"
            >
              <span>View Official Benchmarks</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
