import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight, BrainCircuit } from 'lucide-react';
import vidhyaLogo from '../assets/vidhya_logo.png';

interface NavbarProps {
  onOpenChat?: () => void;
  onOpenBenchmarks?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChat, onOpenBenchmarks }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Benchmarks', href: '#benchmarks', onClick: onOpenBenchmarks },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '#blog' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-3">
      <div 
        className={`max-w-6xl mx-auto transition-all duration-300 rounded-full px-5 py-3 flex items-center justify-between ${
          isScrolled 
            ? 'bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-black/30' 
            : 'bg-slate-950/40 backdrop-blur-md border border-white/10'
        }`}
      >
        {/* Left: Logo & Mark */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative size-9 rounded-xl overflow-hidden bg-white/10 p-1 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-200">
            <img 
              src={vidhyaLogo} 
              alt="Vidhya Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to Lucide icon if image load is interrupted
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <BrainCircuit className="size-5 text-white absolute" style={{ display: 'none' }} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
            Vidhya
          </span>
        </a>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (link.onClick) {
                  e.preventDefault();
                  link.onClick();
                }
              }}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-white text-slate-950 hover:bg-slate-100 active:scale-95 transition-all duration-200 shadow-md shadow-black/20"
          >
            <span>Try Vidhya Free</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-6xl mx-auto bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                className="px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChat?.();
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold bg-white text-slate-950 shadow-lg"
              >
                <span>Try Vidhya Free</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
