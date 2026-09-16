import React from 'react';
import vidhyaLogo from '../assets/vidhya_logo.png';

export const LandingFooter: React.FC = () => {
  const footerLinks = {
    Product: [
      { label: "Socratic Reasoner", href: "#features" },
      { label: "BKT Knowledge Engine", href: "#features" },
      { label: "JEE Advanced Curriculum", href: "#features" },
      { label: "Benchmarks", href: "#benchmarks" }
    ],
    Company: [
      { label: "About Us", href: "#" },
      { label: "Research", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press Kit", href: "#" }
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "STEM Formula Cheatsheets", href: "#" },
      { label: "Community Discord", href: "#" },
      { label: "Student Stories", href: "#testimonials" }
    ],
    Legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Model Ethics", href: "#" },
      { label: "Security", href: "#" }
    ]
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-slate-100">
          
          {/* Logo & Tagline */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs">
                <img 
                  src={vidhyaLogo} 
                  alt="Vidhya Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">Vidhya</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              The AI-powered Socratic STEM tutor for serious competitive examination aspirants. Active reasoning over passive rote memorization.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {category}
              </div>
              <ul className="space-y-2 text-sm">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Copyright Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} Vidhya Inc. All rights reserved. Built for Indian &amp; Global STEM Excellence.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
