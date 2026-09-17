"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  UploadCloud,
  GraduationCap,
  FileSpreadsheet,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";

import { BrandLogo } from "@/components/brand/logo";

export default function LandingPage() {
  const router = useRouter();
  const { demoLogin, isAuthenticated } = useAuth();

  const handleDemoClick = async () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      await demoLogin();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F7F5] text-[#151515] flex flex-col selection:bg-coral-100 selection:text-coral-700">
      
      {/* 1. CLEAN NEAT TOP NAVIGATION */}
      <nav className="w-full bg-[#F7F7F5] border-b border-[#E8E6DE]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          
          {/* Brand Logo with Image 1 Icon */}
          <BrandLogo size="md" showSubtitle={false} href="/" />

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#151515]">
            <a href="#how-it-works" className="flex items-center gap-1 hover:text-[#ff5734] transition-colors py-1">
              Subjects <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </a>
            <a href="#workspace" className="flex items-center gap-1 hover:text-[#ff5734] transition-colors py-1">
              Courses <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </a>
            <a href="#mistakes" className="hover:text-[#ff5734] transition-colors py-1">
              Mistake Intelligence
            </a>
            <a href="#spaced-repetition" className="hover:text-[#ff5734] transition-colors py-1">
              Spaced Repetition
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-5">
            <button
              onClick={handleDemoClick}
              className="hidden sm:inline-block text-sm font-bold text-[#151515] hover:text-[#ff5734] transition-colors"
            >
              Demo Workspace
            </button>
            <Link href="/login" className="text-sm font-bold text-[#151515] hover:text-[#ff5734] transition-colors">
              Sign in
            </Link>
            <Link href="/register">
              <button className="bg-[#ff5734] hover:bg-[#e64320] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-sm">
                Start Learning
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-8 sm:pt-12 pb-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-6 space-y-6 z-10">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3F0] border border-[#FFC8BC] text-[#BD3012] text-xs font-bold tracking-wide uppercase">
              ✨ YOUR PERSONAL STUDY SYSTEM
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-[#151515] leading-[1.08] tracking-tight">
              Study smarter. <br />
              Know what to{" "}
              <span className="relative inline-block text-[#ff5734]">
                learn
                <svg className="absolute left-0 -bottom-1 w-full h-2 text-[#ff5734]" viewBox="0 0 100 12" preserveAspectRatio="none" fill="none">
                  <path d="M0 6 Q 12.5 0, 25 6 T 50 6 T 75 6 T 100 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              <span className="relative inline-block text-[#ff5734]">
                next.
                <svg className="absolute left-0 -bottom-1 w-full h-2 text-[#ff5734]" viewBox="0 0 100 12" preserveAspectRatio="none" fill="none">
                  <path d="M0 6 Q 12.5 0, 25 6 T 50 6 T 75 6 T 100 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#555555] max-w-lg font-medium leading-relaxed">
              IntelliTutor learns what you study, where you struggle, and what you should practice, revise, and master next.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register">
                <button className="bg-[#ff5734] hover:bg-[#e64320] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full transition-all active:scale-95 shadow-sm inline-flex items-center gap-2">
                  Start Learning <span>→</span>
                </button>
              </Link>
              <button
                onClick={handleDemoClick}
                className="bg-white hover:bg-[#FAF9F5] border-2 border-[#151515] text-[#151515] font-bold text-sm sm:text-base px-7 py-3.5 rounded-full transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
              >
                Explore Workspace <span>→</span>
              </button>
            </div>

            {/* Calibrated bottom note */}
            <div className="pt-4 flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <div className="h-8 w-8 rounded-full bg-[#FFF9D6] border-2 border-white flex items-center justify-center font-bold text-[11px] text-[#8F6E00]">
                  AI
                </div>
                <div className="h-8 w-8 rounded-full bg-[#F0E9FD] border-2 border-white flex items-center justify-center font-bold text-[11px] text-[#6C38D4]">
                  IIT
                </div>
                <div className="h-8 w-8 rounded-full bg-[#FFF3F0] border-2 border-white flex items-center justify-center font-bold text-[10px] text-[#BD3012]">
                  MED
                </div>
                <div className="h-8 w-8 rounded-full bg-[#fccc42] border-2 border-white flex items-center justify-center font-bold text-[10px] text-[#151515]">
                  50k+
                </div>
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#151515]">Calibrated with NCERT, PYQs & Syllabi</p>
                <p className="text-[#707070] text-[11px]">For NEET, JEE, UPSC, GATE, CAT & University</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Session Interactive Preview Box */}
          <div className="lg:col-span-6 relative">
            <div className="bg-white border-2 border-[#151515] rounded-[2rem] shadow-[8px_8px_0px_0px_#151515] p-6 sm:p-7 space-y-5 transition-transform hover:-translate-y-1">
              
              {/* Header inside card */}
              <div className="flex justify-end">
                <span className="font-mono text-[11px] font-semibold text-[#555555] bg-[#F7F7F2] px-3 py-1 rounded-md border border-[#E8E6DE]">
                  active_session.live
                </span>
              </div>

              {/* 1. Tutor Speech Box (Lavender) */}
              <div className="bg-[#F0E9FD] border border-[#E0D1FB] p-4 sm:p-5 rounded-2xl flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-full bg-[#BE94F5] flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                  IT
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#6C38D4] tracking-wider uppercase">
                    Personal Tutor
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#151515] leading-snug">
                    &ldquo;Great job on Torque! Let&apos;s conquer <span className="font-bold">Angular Momentum</span> next before tomorrow&apos;s revision.&rdquo;
                  </p>
                </div>
              </div>

              {/* 2. Topic Mastery Card */}
              <div className="bg-[#FAF9F5] border border-[#E8E6DE] p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3F0] text-[#BD3012] border border-[#FFC8BC]">
                    PHYSICS • CH 07
                  </span>
                  <h4 className="font-bold text-[#151515] text-sm sm:text-base leading-tight">
                    Rotational Dynamics
                  </h4>
                  <p className="text-xs text-[#707070]">
                    Conservation of Angular Momentum
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-display font-bold text-[#ff5734]">
                    82%
                  </div>
                  <div className="text-[10px] font-bold text-[#707070] uppercase tracking-wider">
                    Topic Mastery
                  </div>
                </div>
              </div>

              {/* 3. Diagnostic Question Card */}
              <div className="bg-white border border-[#E8E6DE] p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#151515]">
                    Diagnostic Question 04
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF9D6] text-[#8F6E00] border border-[#FFF1A3]">
                    Medium
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                  A rigid body rotates with constant angular acceleration. If its initial velocity is doubled...
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                    ✓ Concept Diagnosed
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF3F0] text-[#BD3012] border border-[#FFC8BC]">
                    Spaced Review Set
                  </span>
                </div>
              </div>

              {/* Footer status line inside preview card */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#707070] font-medium border-t border-[#E8E6DE]/60">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  <span>Real-time adaptive diagnosis</span>
                </div>
                <span className="font-mono text-[10px] text-[#707070]">
                  SM-2 Spaced Algorithm
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* 3. BOTTOM 3 STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10">
          
          {/* Card 1: White Card with Education pill */}
          <div className="bg-white border-2 border-[#151515] p-6 sm:p-7 rounded-[1.75rem] shadow-[4px_4px_0px_0px_#151515] flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1">
            <div className="self-start">
              <span className="inline-block px-3.5 py-1 rounded-xl text-xs font-bold bg-[#be94f5]/30 text-[#6C38D4] border border-[#be94f5]/60">
                Education
              </span>
            </div>
            <div>
              <p className="text-xs text-[#707070] font-semibold">subjects</p>
              <p className="text-4xl sm:text-5xl font-display font-bold text-[#151515] tracking-tight mt-0.5">+40</p>
            </div>
          </div>

          {/* Card 2: Lavender Card with Online pill */}
          <div className="bg-[#be94f5] border-2 border-[#151515] p-6 sm:p-7 rounded-[1.75rem] shadow-[4px_4px_0px_0px_#151515] flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1">
            <div className="self-start">
              <span className="inline-block px-3.5 py-1 rounded-xl text-xs font-bold bg-[#fccc42] text-[#151515] border border-[#151515]/20">
                Online
              </span>
            </div>
            <div>
              <p className="text-xs text-[#151515]/80 font-bold">courses & topics</p>
              <p className="text-4xl sm:text-5xl font-display font-bold text-[#151515] tracking-tight mt-0.5">+120</p>
            </div>
          </div>

          {/* Card 3: Yellow Card with Stars & 5.0 pill */}
          <div className="bg-[#fccc42] border-2 border-[#151515] p-6 sm:p-7 rounded-[1.75rem] shadow-[4px_4px_0px_0px_#151515] flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-1">
            <div className="self-start inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white border border-[#151515]/20 text-xs font-bold text-[#151515]">
              <div className="flex text-[#ff5734] text-xs">
                ★ ★ ★ ★ ★
              </div>
              <span>5.0</span>
            </div>
            <div>
              <p className="text-xs text-[#151515]/80 font-bold">learner reviews</p>
              <p className="text-4xl sm:text-5xl font-display font-bold text-[#151515] tracking-tight mt-0.5">+180k</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SECTION 2 — EDITORIAL CONTRAST */}
      <section id="how-it-works" className="w-full py-24 px-6 sm:px-12 bg-white border-t border-[#E8E6DE]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#151515] leading-tight">
              Most platforms give you <span className="text-[#707070] line-through decoration-coral decoration-2">more to study.</span><br />
              <span className="text-[#ff5734]">IntelliTutor tells you what matters next.</span>
            </h2>
            <p className="text-base text-[#555555]">
              You don't need another massive 800-page book or 50 hours of generic video lectures. You need a precision loop that diagnoses where you leak marks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Traditional Learning */}
            <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DE]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">Traditional Approach</span>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Overwhelming</span>
              </div>
              <ul className="space-y-4 text-sm text-[#555555]">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <span><strong>Endless Passive Videos:</strong> Hours spent watching without retaining core problem-solving intuition.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <span><strong>Static PDFs & Question Banks:</strong> Solving random questions that don't target your specific weak concepts.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <span><strong>Forgotten Mistakes:</strong> Errors made in mock tests get buried in notebooks rather than scheduled for retesting.</span>
                </li>
              </ul>
            </div>

            {/* IntelliTutor Active Cycle */}
            <div className="bg-[#FFF3F0] border-2 border-[#151515] shadow-[6px_6px_0px_0px_#151515] rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#FFC8BC]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#BD3012]">The IntelliTutor Cycle</span>
                <span className="text-xs font-semibold text-[#166534] bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">Personalized</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-[#FFC8BC]">
                  <span className="text-[10px] font-bold text-[#BD3012]">01</span>
                  <p className="text-xs font-bold text-[#151515] mt-1">Understand</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#FFC8BC]">
                  <span className="text-[10px] font-bold text-[#BD3012]">02</span>
                  <p className="text-xs font-bold text-[#151515] mt-1">Practice</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#FFC8BC]">
                  <span className="text-[10px] font-bold text-[#BD3012]">03</span>
                  <p className="text-xs font-bold text-[#151515] mt-1">Analyse</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#FFC8BC]">
                  <span className="text-[10px] font-bold text-[#BD3012]">04</span>
                  <p className="text-xs font-bold text-[#151515] mt-1">Revise</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#FFC8BC]">
                  <span className="text-[10px] font-bold text-[#BD3012]">05</span>
                  <p className="text-xs font-bold text-[#151515] mt-1">Improve</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-[#151515]">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <span><strong>AI Socratic Grounding:</strong> Answers grounded directly in your uploaded textbooks and notes with exact page citations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <span><strong>Root-Cause Mistake Intelligence:</strong> Categorizes errors into Conceptual, Calculation, Careless, or Memory lapses.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <span><strong>Automated Spaced Repetition:</strong> Prompts you to review before the forgetting curve erases your understanding.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 3 — STUDY WORKSPACE SHOWCASE */}
      <section id="workspace" className="w-full py-24 px-6 sm:px-12 bg-[#F7F7F5] border-t border-[#E8E6DE]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="coral">ALL-IN-ONE PLATFORM</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#151515]">
              Your entire study system. One workspace.
            </h2>
            <p className="text-sm sm:text-base text-[#555555] max-w-xl mx-auto">
              Everything you study, practice, analyze, and revise lives in one unified, distraction-free environment.
            </p>
          </div>

          {/* Framed Product Showcase */}
          <div className="bg-white rounded-3xl border-2 border-[#151515] shadow-[8px_8px_0px_0px_#151515] p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6DE]">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5734]">TODAY'S TARGET • NEET 2026</span>
                <h3 className="text-2xl font-display font-bold text-[#151515]">Good morning, Aarav.</h3>
                <p className="text-xs text-[#555555]">Here is your high-priority study plan for today.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDemoClick} className="bg-[#ff5734] text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-[#e64320] flex items-center gap-1">
                  Launch Interactive Demo
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#FFF3F0] border-2 border-[#151515] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#BD3012] bg-white px-3 py-1 rounded-full border border-[#FFC8BC]">
                    TODAY'S FOCUS
                  </span>
                  <span className="text-xs font-mono font-bold text-[#BD3012]">20 min practice</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-xl text-[#151515]">Physics: Rotational Motion</h4>
                  <p className="text-xs text-[#555555] mt-1">Angular momentum conservation and rolling without slipping.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#FFC8BC] space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Current Topic Mastery</span>
                    <span className="text-[#FF5734]">42%</span>
                  </div>
                  <div className="h-2 w-full bg-[#FFE4DE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF5734] rounded-full" style={{ width: "42%" }} />
                  </div>
                </div>
                <div className="bg-white/80 p-3.5 rounded-xl border border-[#FFC8BC] flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-[#FF5734] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#151515]">
                    <strong>AI Recommendation:</strong> "Review angular momentum before attempting your next diagnostic problem set."
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#F0E9FD] border-2 border-[#151515] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6C38D4] uppercase">Revision Due</span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-[#E0D1FB]">3 Topics</span>
                  </div>
                  <p className="text-sm font-display font-bold text-[#151515]">Thermodynamics & Cell Cycle</p>
                  <p className="text-xs text-[#555555]">Spaced interval reached optimal recall point.</p>
                </div>

                <div className="bg-[#FFF9D6] border-2 border-[#151515] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8F6E00] uppercase">Adaptive Practice</span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-[#FFF1A3]">20 Questions</span>
                  </div>
                  <p className="text-sm font-display font-bold text-[#151515]">Targeted Error Correction</p>
                  <p className="text-xs text-[#555555]">Calibrated to eliminate your common careless mistakes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4 — PERSONAL STUDY LIBRARY */}
      <section id="library" className="w-full py-24 px-6 sm:px-12 bg-white border-t border-[#E8E6DE]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <Badge variant="lavender">KNOWLEDGE BASE</Badge>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#151515]">
                Turn your notes into your own knowledge base.
              </h2>
              <p className="text-sm sm:text-base text-[#555555]">
                Upload your textbooks, coaching modules, hand-written notes, and PYQ collections. IntelliTutor indexes every formula and diagram.
              </p>
            </div>
            <Link href="/library">
              <button className="bg-white border-2 border-[#151515] font-bold text-xs sm:text-sm px-6 py-3 rounded-full hover:bg-[#FAF9F5] flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-[#ff5734]" />
                Upload Notes
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAF9F5] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-2xl p-5 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="h-32 rounded-xl bg-[#FFF3F0] border border-[#FFC8BC] flex flex-col justify-between p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#BD3012] bg-white px-2 py-0.5 rounded-md self-start border border-[#FFC8BC]">
                  PHYSICS
                </span>
                <BookOpen className="h-8 w-8 text-[#FF5734] self-end opacity-80" />
                <span className="text-xs font-bold text-[#BD3012]">NCERT Class 11</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#151515]">Rotational Dynamics</h4>
                <p className="text-xs text-[#707070] mt-0.5">PDF • 42 pages • Fully Indexed</p>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-2xl p-5 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="h-32 rounded-xl bg-[#F0E9FD] border border-[#E0D1FB] flex flex-col justify-between p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C38D4] bg-white px-2 py-0.5 rounded-md self-start border border-[#E0D1FB]">
                  CHEMISTRY
                </span>
                <FileText className="h-8 w-8 text-[#B99AF5] self-end opacity-80" />
                <span className="text-xs font-bold text-[#6C38D4]">Organic Mechanisms</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#151515]">Aldehydes & Ketones</h4>
                <p className="text-xs text-[#707070] mt-0.5">PDF • 28 pages • 84 Concepts</p>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-2xl p-5 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="h-32 rounded-xl bg-[#FFF9D6] border border-[#FFF1A3] flex flex-col justify-between p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6E00] bg-white px-2 py-0.5 rounded-md self-start border border-[#FFF1A3]">
                  BIOLOGY
                </span>
                <GraduationCap className="h-8 w-8 text-[#FFCC42] self-end opacity-80" />
                <span className="text-xs font-bold text-[#8F6E00]">Human Physiology</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#151515]">Endocrine System</h4>
                <p className="text-xs text-[#707070] mt-0.5">PDF • 36 pages • High Yield</p>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-2xl p-5 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="h-32 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col justify-between p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] bg-white px-2 py-0.5 rounded-md self-start border border-[#BBF7D0]">
                  ARCHIVE
                </span>
                <FileSpreadsheet className="h-8 w-8 text-[#16A34A] self-end opacity-80" />
                <span className="text-xs font-bold text-[#166534]">10-Year PYQ Bank</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#151515]">NEET & JEE Questions</h4>
                <p className="text-xs text-[#707070] mt-0.5">Vetted • 1,500+ Questions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA & FOOTER */}
      <section className="w-full py-24 px-6 sm:px-12 bg-[#fccc42] border-t-2 border-[#151515]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#151515] leading-tight">
            Stop studying everything.<br />
            Start studying what matters.
          </h2>
          <p className="text-base sm:text-lg text-[#151515]/80 max-w-xl mx-auto font-medium">
            Build an intelligent study system that adapts to your brain, tracks every error, and guides you to exam success.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <button className="bg-[#151515] text-white hover:bg-[#2B2B2B] h-13 px-8 py-3.5 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-95">
                Start Learning Now →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="w-full bg-white border-t border-[#E8E6DE] py-12 px-6 sm:px-12 text-xs text-[#555555]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-[#151515]">Intelli<span className="text-[#ff5734]">Tutor</span> AI</span>
          </div>
          <p className="text-[#707070]">© {new Date().getFullYear()} IntelliTutor AI. Personal Study Coach & Adaptive Learning Platform.</p>
        </div>
      </footer>

    </div>
  );
}
