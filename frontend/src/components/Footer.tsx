import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  setActivePage: (page: 'home' | 'about' | 'chat' | 'benchmarks') => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePage }) => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-xs py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">Vidhya STEM AI</div>
              <div className="text-[11px] text-slate-400">Next-Generation Socratic Reasoning Lab</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-600">
            <button onClick={() => setActivePage('home')} className="hover:text-brand-600 transition-colors">
              Home
            </button>
            <button onClick={() => setActivePage('chat')} className="hover:text-brand-600 transition-colors">
              Solve &amp; Chat
            </button>
            <button onClick={() => setActivePage('about')} className="hover:text-brand-600 transition-colors">
              Pedagogy &amp; Architecture
            </button>
            <button onClick={() => setActivePage('benchmarks')} className="hover:text-brand-600 transition-colors">
              Empirical Benchmarks
            </button>
          </div>

          <div className="text-slate-400 text-center md:text-right">
            <span>© 2026 Vidhya AI Project. Built for Indian &amp; Global STEM Excellence.</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
