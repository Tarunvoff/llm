"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, Filter, Search, ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MistakesPage() {
  const [filterType, setFilterType] = useState("All");

  const mistakes = [
    {
      id: "m1",
      subject: "Physics",
      topic: "Rotational Motion",
      concept: "Radian to Revolution Angular Acceleration Conversion",
      mistakeType: "Conceptual",
      question: "A rigid body rotates about a fixed axis with constant angular acceleration α. If it makes N revolutions in time t, find α.",
      userAnswer: "α = 4πN / t² (Missed factor of 2 during radian conversion)",
      correctAnswer: "α = 4πN / t²",
      explanation: "Remember θ = 2πN radians. Using θ = 1/2 α t² gives 2πN = 1/2 α t² => α = 4πN / t².",
      retestScheduled: "Due Today",
      isResolved: false,
    },
    {
      id: "m2",
      subject: "Chemistry",
      topic: "Organic Reactions",
      concept: "Carbocation Stability & Markovnikov Addition",
      mistakeType: "Conceptual",
      question: "Which intermediate is formed in the acid-catalyzed hydration of propene?",
      userAnswer: "Primary carbocation",
      correctAnswer: "Secondary carbocation (2-propyl cation)",
      explanation: "Markovnikov's rule dictates protonation occurs on less substituted carbon to generate the more stable secondary carbocation intermediate.",
      retestScheduled: "Tomorrow",
      isResolved: false,
    },
    {
      id: "m3",
      subject: "Biology",
      topic: "Cell Division",
      concept: "Chiasmata Formation Stage",
      mistakeType: "Memory",
      question: "In which sub-stage of Prophase I does crossing over occur?",
      userAnswer: "Diplotene",
      correctAnswer: "Pachytene",
      explanation: "Crossing over occurs at Pachytene via recombinase enzyme; Chiasmata become visible at Diplotene.",
      retestScheduled: "Resolved",
      isResolved: true,
    },
  ];

  const filteredMistakes = filterType === "All"
    ? mistakes
    : mistakes.filter((m) => m.mistakeType.toLowerCase() === filterType.toLowerCase());

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Mistake Journal</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              "Your mistakes are your study roadmap." Every error is classified by cognitive root cause and queued for spaced retesting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
              Retest All Due (2)
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Conceptual", "Calculation", "Careless", "Memory", "Time management"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === t
                  ? "bg-[#151515] text-white shadow-sm"
                  : "bg-white text-[#555555] border border-[#E8E6DE] hover:text-[#151515] hover:bg-[#FAF9F5]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Mistakes Stacked List */}
        <div className="space-y-5">
          {filteredMistakes.map((m) => (
            <div
              key={m.id}
              className="bg-white border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-3xl p-6 sm:p-7 space-y-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFEFE8]">
                <div className="flex items-center gap-2.5">
                  <Badge variant={m.mistakeType === "Conceptual" ? "coral" : "yellow"} className="text-xs font-bold">
                    {m.mistakeType} Error
                  </Badge>
                  <span className="text-xs font-bold text-[#555555]">
                    {m.subject} • {m.topic}
                  </span>
                </div>
                <Badge
                  variant={m.isResolved ? "academic" : m.retestScheduled === "Due Today" ? "coral" : "yellow"}
                  className="text-xs font-bold self-start sm:self-auto"
                >
                  {m.retestScheduled}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-display font-semibold text-[#151515]">{m.question}</p>
              </div>

              {/* Comparative User Answer vs Correct Answer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs">
                <div className="space-y-1">
                  <span className="text-red-700 font-bold text-[11px] uppercase tracking-wide">Your Choice:</span>
                  <p className="text-[#3D3D3D] font-medium">{m.userAnswer}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#166534] font-bold text-[11px] uppercase tracking-wide">Correct Solution:</span>
                  <p className="text-[#151515] font-semibold">{m.correctAnswer}</p>
                </div>
              </div>

              <div className="text-xs text-[#555555] space-y-1.5">
                <p><strong className="text-[#151515]">Weak Concept:</strong> {m.concept}</p>
                <p><strong className="text-[#151515]">Root Cause:</strong> {m.explanation}</p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#EFEFE8]">
                <span className="text-xs text-[#707070] font-semibold">
                  Spaced Retest Interval: {m.isResolved ? "Mastered" : "Active Queue"}
                </span>
                <Button variant="primary" size="sm" className="h-8 text-xs px-4 font-bold">
                  Retest Question Now →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
