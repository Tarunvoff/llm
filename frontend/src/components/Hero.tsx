import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Component as GridBackground } from './ui/grid-background';
import vidhyaLogo from '../assets/vidhya_logo.png';

interface HeroProps {
  onStartLearning?: () => void;
  onSeeHowItWorks?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartLearning, onSeeHowItWorks }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax scroll effect: background moves at 0.4x scroll speed
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 600], [0, 240]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-32 px-4 sm:px-6 lg:px-8 bg-white"
    >
      {/* Parallax Grid Background Layer */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none"
      >
        <GridBackground />
      </motion.div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6">
        
        {/* Brand Logo Display from Uploaded Asset */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative size-28 sm:size-32 mb-2 p-2 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl border border-slate-200/80 flex items-center justify-center hover:scale-105 transition-transform duration-300"
        >
          <img 
            src={vidhyaLogo} 
            alt="Vidhya Official STEM Logo" 
            className="w-full h-full object-contain drop-shadow-md"
          />
        </motion.div>

        {/* 1. Small Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-200 text-purple-900 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
        >
          <Sparkles className="size-4 text-purple-600 animate-pulse" />
          <span>AI-Powered Socratic Tutor</span>
          <span className="text-purple-400">·</span>
          <span className="text-purple-700 font-bold">2026 Edition</span>
        </motion.div>

        {/* 2. Oversized Bold Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] max-w-3xl"
        >
          Learn the Way Toppers{' '}
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Actually Learn
          </span>
        </motion.h1>

        {/* 3. Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-[620px] leading-relaxed font-normal"
        >
          Vidhya doesn't just give you answers — it asks the right questions, tracks what you've truly mastered, and guides you to the next concept only when you're ready.
        </motion.p>

        {/* 4. Two CTA Buttons Side by Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={onStartLearning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-xl shadow-slate-950/20 active:scale-95 transition-all duration-200"
          >
            <span>Start Learning Free</span>
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={onSeeHowItWorks}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/80 hover:bg-white text-slate-900 font-bold text-sm sm:text-base border border-slate-200 shadow-sm active:scale-95 transition-all duration-200"
          >
            <Play className="size-4 text-slate-600 fill-slate-600" />
            <span>See How It Works</span>
          </button>
        </motion.div>

        {/* 5. Small Trust Row beneath CTAs */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xs sm:text-sm text-slate-400 font-medium pt-3"
        >
          Trusted by students preparing for <strong className="text-slate-600 font-semibold">JEE • NEET • Olympiads</strong>
        </motion.p>

      </div>

      {/* STEP 5: Smooth Gradient-Fade Div at Bottom Edge of Hero (180px tall) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-white pointer-events-none z-20" 
        aria-hidden="true"
      />
    </section>
  );
};

export default Hero;
