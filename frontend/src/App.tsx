import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import BenchmarksTeaser from './components/BenchmarksTeaser';
import Testimonials from './components/Testimonials';
import FinalCTA from './components/FinalCTA';
import LandingFooter from './components/LandingFooter';
import Chat from './pages/Chat';
import Benchmarks from './pages/Benchmarks';
import { ArrowLeft } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'landing' | 'chat' | 'benchmarks'>('landing');

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-purple-600 selection:text-white">
      
      {/* If in Chat or Benchmarks sub-view, provide a quick return bar */}
      {view !== 'landing' && (
        <div className="sticky top-0 z-50 bg-slate-950 text-white px-6 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Vidhya Landing Page</span>
          </button>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setView('chat')}
              className={view === 'chat' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-white'}
            >
              Chat App
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setView('benchmarks')}
              className={view === 'benchmarks' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-white'}
            >
              Benchmarks Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {view === 'landing' && (
          <>
            {/* Pitch.com-style Navbar */}
            <Navbar 
              onOpenChat={() => setView('chat')} 
              onOpenBenchmarks={() => setView('benchmarks')} 
            />

            {/* Centered Hero Section with Parallax Grid Background */}
            <Hero 
              onStartLearning={() => setView('chat')} 
              onSeeHowItWorks={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }} 
            />

            {/* Below Hero: All White Background */}
            <TrustStrip />
            <Features />
            <HowItWorks />
            <BenchmarksTeaser onSeeFullBenchmarks={() => setView('benchmarks')} />
            <Testimonials />
            <FinalCTA onStartLearning={() => setView('chat')} />
            <LandingFooter />
          </>
        )}

        {view === 'chat' && (
          <Chat />
        )}

        {view === 'benchmarks' && (
          <Benchmarks />
        )}
      </main>

    </div>
  );
}

export default App;
