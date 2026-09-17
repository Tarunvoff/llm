"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, Filter, Search, ArrowRight } from "lucide-react";
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
      userAnswer: "α = 4πN / t²",
      correctAnswer: "α = 4πN / t² (Missed factor of 2 during radian conversion)",
      explanation: "Remember θ = 2πN radians. Using θ = 1/2 α t² gives 2πN = 1/2 α t² => α = 4πN / t².",
      retestScheduled: "Today",
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Mistake Journal</h2>
            <p className="text-xs text-ink-400">
              "Your mistakes are your study map." Every wrong answer is decomposed by root cause and scheduled for retesting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 border-ink-700">
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
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-ink-800 text-white border border-ink-700"
                  : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Mistakes List */}
        <div className="space-y-4">
          {mistakes.map((m) => (
            <Card key={m.id} className="space-y-3 border-ink-800/90 bg-ink-900/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={m.mistakeType === "Conceptual" ? "danger" : "warning"} className="text-[10px] font-mono">
                    {m.mistakeType} Error
                  </Badge>
                  <span className="text-xs font-medium text-ink-300">
                    {m.subject} · {m.topic}
                  </span>
                </div>
                <Badge variant={m.isResolved ? "academic" : "warning"} className="text-[10px] font-mono">
                  {m.retestScheduled}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-100">{m.question}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded bg-ink-950 border border-ink-800/80 text-xs">
                <div>
                  <span className="text-red-400 font-mono text-[10px] uppercase font-semibold">Your Answer:</span>
                  <p className="text-ink-300 mt-0.5">{m.userAnswer}</p>
                </div>
                <div>
                  <span className="text-academic-400 font-mono text-[10px] uppercase font-semibold">Correct Answer:</span>
                  <p className="text-ink-100 mt-0.5">{m.correctAnswer}</p>
                </div>
              </div>

              <div className="text-xs text-ink-400 space-y-1">
                <p><strong className="text-ink-200">Concept:</strong> {m.concept}</p>
                <p><strong className="text-ink-200">Why it went wrong:</strong> {m.explanation}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-ink-800/60 text-xs">
                <span className="text-[11px] text-ink-500 font-mono">BKT Retest Status: Queued</span>
                <Button variant="academic" size="sm" className="h-7 text-xs px-3">
                  Retest Question Now →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
