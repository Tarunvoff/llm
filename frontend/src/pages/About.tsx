import React from 'react';
import { 
  Brain, 
  Network, 
  Cpu, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Award,
  Target
} from 'lucide-react';

interface AboutProps {
  setActivePage: (page: 'home' | 'about' | 'chat' | 'benchmarks') => void;
}

export const About: React.FC<AboutProps> = ({ setActivePage }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Editorial Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>The Science Behind Vidhya</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Built from First Principles for Competitive STEM Mastery
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Unlike generic chat models that either spoil solutions or hallucinate algebra, Vidhya 2.0 couples high-capacity STEM reasoning with verified pedagogical cognitive science.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pillar 1: Socratic Guidance */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="size-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold">
              <Brain className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">1. Socratic Scaffolding Engine</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When a student asks for help on an advanced problem, Vidhya decomposes the problem into fundamental conceptual steps. It offers calibrated hint tiers instead of revealing the final numerical solution immediately, cultivating genuine mathematical intuition.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Calibrated hint ladders (conceptual, algorithmic, formulaic)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Misconception diagnosis from student intermediate work</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Bayesian Knowledge Tracing (BKT) */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Network className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">2. Bayesian Knowledge Tracing (BKT)</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Vidhya maintains an active student mastery probability across 128 prerequisite nodes in the STEM knowledge graph. It dynamically updates $P(L_t)$ based on transition probability $P(T)$, slip probability $P(S)$, and guess probability $P(G)$.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Identifies root conceptual bottlenecks in prerequisite chains</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Prevents cognitive overload during multi-concept calculus</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: 20B Mixture-of-Experts */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Cpu className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">3. Specialized 20B MoE Architecture</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our model architecture uses sparse Mixture-of-Experts routing. Different feed-forward sub-networks are specialized for symbolic calculus, rotational dynamics, organic synthesis, and molecular genetics, activating only 3.8B parameters per token.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Sub-150ms time-to-first-token inference latency</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Native LaTeX and mathematical syntax generation</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4: Token Efficiency & Conciseness */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">4. Extreme Token Efficiency</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              While contemporary reasoning models often consume 6,000 to 12,000 output tokens reciting redundant internal loops, Vidhya achieves 86.51% JEE Advanced accuracy with an average of only 2,102 tokens—yielding a 42.31 accuracy-per-token ratio.
            </p>
            <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>64% lower compute and latency footprint</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-500" />
                <span>Laser-focused step derivations without stream-of-consciousness fluff</span>
              </li>
            </ul>
          </div>

        </div>

        {/* CTA Banner */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Try Vidhya on Your Toughest STEM Question</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Experience our Socratic reasoning engine and see the difference in explanation clarity.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActivePage('chat')}
              className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-colors"
            >
              Start Free Chat Session
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
