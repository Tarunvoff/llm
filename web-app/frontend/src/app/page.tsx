"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Flame,
  HelpCircle,
  Layers,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  AlertTriangle,
  FileText,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function LandingPage() {
  const router = useRouter();
  const { demoLogin, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"tutor" | "library" | "practice" | "mistakes" | "revision">("tutor");

  const handleDemoClick = async () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      await demoLogin();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col selection:bg-academic-700/40 selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-ink-800/80 bg-ink-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-academic-700 text-white font-mono text-xs font-bold shadow-sm ring-1 ring-academic-500/50">
              IT
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-wider uppercase text-ink-100">
                IntelliTutor AI
              </span>
              <span className="text-[10px] text-academic-400 font-mono leading-none">
                Personal Study Coach
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-ink-400">
            <a href="#how-it-works" className="hover:text-ink-200 transition-colors">How It Works</a>
            <a href="#system" className="hover:text-ink-200 transition-colors">Study Workspace</a>
            <a href="#pedagogy" className="hover:text-ink-200 transition-colors">Mistake Intelligence</a>
            <a href="#spaced-repetition" className="hover:text-ink-200 transition-colors">Spaced Repetition</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDemoClick}
              className="text-xs h-8 border-ink-700/60 text-ink-200 hover:text-white"
            >
              Demo Workspace
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs h-8 text-ink-300 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="academic" size="sm" className="text-xs h-8 font-medium">
                Start Learning
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden border-b border-ink-800/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-900 border border-ink-800 text-academic-400 text-xs font-mono tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            <span>PERSONALIZED LEARNING SYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink-50 leading-[1.12]">
            Study smarter.<br />
            <span className="text-ink-300 font-normal">Because your learning should be personal.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-ink-400 leading-relaxed font-normal">
            IntelliTutor continuously diagnoses what you study, where you struggle, and what you should do next. No generic chatbots—just a dedicated personal study system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button variant="academic" size="lg" className="h-11 px-6 text-sm font-semibold">
                Start Learning
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDemoClick}
              className="h-11 px-6 text-sm border border-ink-700/60 bg-ink-900 text-ink-200 hover:text-white"
            >
              <Play className="h-3.5 w-3.5 mr-2 fill-current" />
              Explore Live Demo
            </Button>
          </div>

          {/* Key Metric Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-400 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-academic-400" />
              <span>Document-Grounded RAG</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-academic-400" />
              <span>Socratic Diagnosis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-academic-400" />
              <span>Bayesian Mastery Tracking</span>
            </div>
          </div>
        </div>

        {/* Sophisticated Study Workspace Preview */}
        <div className="max-w-5xl mx-auto mt-14 rounded-xl border border-ink-800 bg-ink-900/90 shadow-elevated p-6 overflow-hidden">
          {/* Mock App Header */}
          <div className="flex items-center justify-between pb-5 border-b border-ink-800/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-ink-700" />
              </div>
              <span className="text-ink-400 font-mono">Workspace / Aarav Sharma (NEET Aspirant)</span>
            </div>
            <div className="flex items-center gap-3 text-ink-400 font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="h-3.5 w-3.5 fill-amber-400/20" /> 7d streak
              </span>
              <span className="flex items-center gap-1 text-academic-400">
                <Zap className="h-3.5 w-3.5" /> 580 XP
              </span>
            </div>
          </div>

          {/* Dashboard Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
            {/* Column 1: Today's Plan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
                  Today's Study Agenda
                </p>
                <Badge variant="academic" className="text-[10px] font-mono">1/3 Done</Badge>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-md bg-ink-950/80 border border-ink-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-ink-200">Biology · Cell Division</p>
                    <p className="text-[11px] text-ink-500 font-mono">08:00 (45 min)</p>
                  </div>
                  <Badge variant="academic" className="text-[10px]">Completed</Badge>
                </div>

                <div className="p-3 rounded-md bg-ink-950/80 border border-academic-700/40 flex items-center justify-between ring-1 ring-academic-700/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-ink-100">Physics · Kinematics Set</p>
                    <p className="text-[11px] text-academic-400 font-mono">10:30 (60 min) · Up Next</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Practice</Badge>
                </div>

                <div className="p-3 rounded-md bg-ink-950/80 border border-ink-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-ink-300">Physics · Mistake Review</p>
                    <p className="text-[11px] text-ink-500 font-mono">18:00 (30 min)</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">Revision</Badge>
                </div>
              </div>
            </div>

            {/* Column 2: Weak Topics & Attention */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
                  Needs Attention
                </p>
                <span className="text-[11px] text-ink-500 font-mono">Diagnostic BKT</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-md bg-ink-950/80 border border-red-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-red-300">Rotational Motion</span>
                    <span className="font-mono text-red-400 font-semibold">42%</span>
                  </div>
                  <div className="h-1.5 w-full bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-[42%]" />
                  </div>
                  <p className="text-[10px] text-ink-500">3 repeated calculation & conceptual errors</p>
                </div>

                <div className="p-3 rounded-md bg-ink-950/80 border border-amber-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-300">Organic Reactions</span>
                    <span className="font-mono text-amber-400 font-semibold">48%</span>
                  </div>
                  <div className="h-1.5 w-full bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[48%]" />
                  </div>
                  <p className="text-[10px] text-ink-500">Markovnikov addition misconception</p>
                </div>

                <div className="p-3 rounded-md bg-ink-950/80 border border-amber-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-300">Cell Division</span>
                    <span className="font-mono text-amber-400 font-semibold">51%</span>
                  </div>
                  <div className="h-1.5 w-full bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[51%]" />
                  </div>
                  <p className="text-[10px] text-ink-500">Crossing over in Prophase I</p>
                </div>
              </div>
            </div>

            {/* Column 3: AI Recommendation & Spaced Repetition */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-academic-400 font-mono">
                AI Coach Recommendation
              </p>

              <div className="p-3.5 rounded-md bg-academic-950/60 border border-academic-700/50 space-y-2">
                <div className="flex items-center gap-1.5 text-academic-300 text-xs font-semibold">
                  <Bot className="h-4 w-4" />
                  <span>Targeted Remediation</span>
                </div>
                <p className="text-xs text-ink-300 leading-relaxed">
                  "You've made the same conceptual mistake in <strong className="text-ink-100">Rotational Motion</strong> three times. Review angular momentum for 20 minutes before attempting another problem set."
                </p>
                <div className="pt-1">
                  <span className="inline-block text-[11px] font-medium text-academic-400 underline underline-offset-4">
                    Open Recommended Review →
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-ink-950/80 border border-ink-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-400 font-mono text-[11px] uppercase">Revision Due</span>
                  <span className="text-amber-400 font-mono text-[11px]">2 due today</span>
                </div>
                <p className="text-xs text-ink-200 font-medium truncate">
                  • Conservation of Angular Momentum
                </p>
                <p className="text-xs text-ink-200 font-medium truncate">
                  • Mitosis vs Meiosis Stages
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalization Story Section */}
      <section id="how-it-works" className="py-20 px-6 border-b border-ink-800/60">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-academic-400">
              The Pedagogical Difference
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-50">
              Moving from Static Content to Adaptive Intelligence
            </h2>
            <p className="text-sm text-ink-400 max-w-2xl mx-auto">
              Most platforms dump content onto students. IntelliTutor models your cognitive mastery, diagnoses error types, and personalizes every subsequent problem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Platforms */}
            <div className="p-6 rounded-lg bg-ink-900/50 border border-ink-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-ink-500 font-semibold">Traditional Platforms</span>
                <Badge variant="outline" className="text-ink-500">Passive</Badge>
              </div>
              <div className="p-3 bg-ink-950 rounded border border-ink-800 font-mono text-xs text-ink-400 flex items-center justify-between">
                <span>Generic Textbook / Video</span>
                <span>→</span>
                <span>All Students</span>
              </div>
              <ul className="space-y-2 text-xs text-ink-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span> Same repetitive explanations regardless of previous mistakes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span> Provides direct answers immediately without guiding the student
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✕</span> No memory of conceptual vs calculation errors
                </li>
              </ul>
            </div>

            {/* IntelliTutor Platform */}
            <div className="p-6 rounded-lg bg-academic-950/40 border border-academic-700/50 space-y-4 ring-1 ring-academic-600/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-academic-300 font-semibold">IntelliTutor System</span>
                <Badge variant="academic">Continuous Loop</Badge>
              </div>
              <div className="p-3 bg-ink-950 rounded border border-academic-700/40 font-mono text-xs text-academic-300 flex items-center justify-between">
                <span>Student</span>
                <span>→</span>
                <span>Diagnose</span>
                <span>→</span>
                <span>Practice</span>
                <span>→</span>
                <span>Adapt</span>
              </div>
              <ul className="space-y-2 text-xs text-ink-200">
                <li className="flex items-start gap-2">
                  <span className="text-academic-400">✓</span> RAG grounded strictly in your syllabus and uploaded notes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-academic-400">✓</span> Socratic hints that guide without spoiling the answer
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-academic-400">✓</span> Mistake Journal with automated spaced-repetition retests
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive System Capabilities Tabs */}
      <section id="system" className="py-20 px-6 border-b border-ink-800/60 bg-ink-900/30">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-academic-400">
              Core Capabilities
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-50">
              A Complete Academic Workspace
            </h2>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-ink-800 pb-4">
            {[
              { id: "tutor", label: "AI Tutor", icon: Bot },
              { id: "library", label: "Study Library", icon: BookOpen },
              { id: "practice", label: "Adaptive Practice", icon: HelpCircle },
              { id: "mistakes", label: "Mistake Intelligence", icon: AlertTriangle },
              { id: "revision", label: "Spaced Repetition", icon: RotateCcw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-ink-800 text-white border border-ink-700 font-semibold"
                      : "text-ink-400 hover:text-ink-200 hover:bg-ink-900"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-academic-400" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="rounded-xl border border-ink-800 bg-ink-900/80 p-6 md:p-8">
            {activeTab === "tutor" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-academic-400" />
                    <span className="text-xs font-semibold text-ink-200">Socratic Physics Dialogue</span>
                  </div>
                  <Badge variant="neutral" className="text-[10px]">Exam-Oriented Mode</Badge>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-ink-950 rounded border border-ink-800 text-ink-200">
                    <strong className="text-academic-400 font-mono">Student:</strong> "Explain Kirchhoff's current and voltage laws with a competitive exam tip."
                  </div>
                  <div className="p-4 bg-ink-950/60 rounded border border-academic-900/60 text-ink-200 space-y-2">
                    <p><strong>1. Kirchhoff's Current Law (KCL):</strong> The algebraic sum of currents meeting at any junction is zero. This is a direct consequence of the <em>Conservation of Charge</em>.</p>
                    <p><strong>2. Kirchhoff's Voltage Law (KVL):</strong> The algebraic sum of changes in potential around any closed loop is zero. This is a direct consequence of the <em>Conservation of Energy</em>.</p>
                    <div className="p-2.5 rounded bg-ink-900 border border-academic-800/40 text-[11px] text-academic-300">
                      <strong>Exam Tip:</strong> In complex bridge circuits, choose the node with the maximum connected branches as reference zero potential (nodal analysis) to avoid solving 3x3 simultaneous loop equations.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "library" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                  <span className="text-xs font-semibold text-ink-200">Multi-Modal Knowledge Ingestion</span>
                  <Badge variant="academic" className="text-[10px]">RAG Ready</Badge>
                </div>
                <p className="text-xs text-ink-400">
                  Upload textbooks, handwritten lecture notes, and mock papers (PDF, DOCX, Images). The ingestion engine extracts topics, computes embeddings, and indexes every formula with page-level citations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded bg-ink-950 border border-ink-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-200">NCERT Physics Class 12.pdf</span>
                      <Badge variant="academic" className="text-[9px]">420 Pages</Badge>
                    </div>
                    <p className="text-[11px] text-ink-500 font-mono">Topics indexed: Electrostatics, Current, Optics</p>
                  </div>
                  <div className="p-3 rounded bg-ink-950 border border-ink-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink-200">Organic Mechanisms Lecture Notes.pdf</span>
                      <Badge variant="academic" className="text-[9px]">64 Pages</Badge>
                    </div>
                    <p className="text-[11px] text-ink-500 font-mono">Topics indexed: Nucleophilic & Electrophilic</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "practice" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                  <span className="text-xs font-semibold text-ink-200">Adaptive Diagnostic Generation</span>
                  <Badge variant="warning" className="text-[10px]">Hard / Exam Level</Badge>
                </div>
                <div className="p-4 bg-ink-950 rounded border border-ink-800 space-y-3 text-xs">
                  <p className="font-medium text-ink-100">
                    A cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. What is the acceleration of the cylinder?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink-300">
                    <div className="p-2 rounded bg-ink-900 border border-ink-800">A) (1/2) g sin θ</div>
                    <div className="p-2 rounded bg-academic-950 border border-academic-600 text-academic-300 font-semibold">B) (2/3) g sin θ (Correct)</div>
                    <div className="p-2 rounded bg-ink-900 border border-ink-800">C) (3/4) g sin θ</div>
                    <div className="p-2 rounded bg-ink-900 border border-ink-800">D) g sin θ</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "mistakes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                  <span className="text-xs font-semibold text-ink-200">Root-Cause Error Classification</span>
                  <Badge variant="danger" className="text-[10px]">Conceptual Error</Badge>
                </div>
                <div className="p-4 bg-ink-950 rounded border border-red-900/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-300">Markovnikov Carbocation Intermediate</span>
                    <span className="text-ink-500 font-mono text-[10px]">Retest Scheduled</span>
                  </div>
                  <p className="text-ink-400">
                    <strong>Mistake:</strong> Selected primary carbocation instead of the secondary 2-propyl cation during hydration of propene.
                  </p>
                  <p className="text-ink-300 text-[11px]">
                    <strong>Remedy:</strong> Carbocation stability order (3° &gt; 2° &gt; 1°) dictates preferential proton addition to the least substituted carbon.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "revision" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                  <span className="text-xs font-semibold text-ink-200">Ebbinghaus Forgetting Curve Timeline</span>
                  <Badge variant="academic" className="text-[10px]">Optimal Decay Prevention</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-ink-950 rounded border border-amber-800/60 space-y-1">
                    <p className="font-mono text-[10px] text-amber-400 uppercase">Today (Stage 1)</p>
                    <p className="font-medium text-ink-200">Angular Momentum</p>
                  </div>
                  <div className="p-3 bg-ink-950 rounded border border-ink-800 space-y-1">
                    <p className="font-mono text-[10px] text-ink-500 uppercase">In 3 Days (Stage 2)</p>
                    <p className="font-medium text-ink-300">Carbocation Rules</p>
                  </div>
                  <div className="p-3 bg-ink-950 rounded border border-ink-800 space-y-1">
                    <p className="font-mono text-[10px] text-ink-500 uppercase">In 7 Days (Stage 3)</p>
                    <p className="font-medium text-ink-300">Mitosis Prophase I</p>
                  </div>
                  <div className="p-3 bg-ink-950 rounded border border-ink-800 space-y-1">
                    <p className="font-mono text-[10px] text-ink-500 uppercase">In 30 Days (Stage 4)</p>
                    <p className="font-medium text-ink-300">Thermodynamics</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final Call To Action */}
      <section className="py-20 px-6 text-center border-b border-ink-800/60 bg-ink-950">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-50">
            Stop studying everything.<br />
            <span className="text-academic-400 font-normal">Start studying what matters.</span>
          </h2>

          <p className="text-sm text-ink-400">
            Join thousands of competitive aspirants maximizing retention, eliminating recurring mistakes, and preparing systematically with IntelliTutor AI.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button variant="academic" size="lg" className="h-11 px-6 font-semibold text-sm">
                Get Started Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDemoClick}
              className="h-11 px-6 text-sm border-ink-700/60 text-ink-300 hover:text-white"
            >
              Open Instant Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Minimal Academic Footer */}
      <footer className="py-8 px-6 border-t border-ink-800/80 bg-ink-950 text-xs text-ink-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink-300">INTELLITUTOR AI</span>
            <span>· Pedagogically Aligned Study System</span>
          </div>
          <div>
            Built with Next.js, FastAPI & Google Gemini API
          </div>
        </div>
      </footer>
    </div>
  );
}
