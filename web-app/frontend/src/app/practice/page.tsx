"use client";

import React, { useState } from "react";
import { HelpCircle, Play, Sparkles, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PracticePage() {
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState("Exam level");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Adaptive Practice Generator</h2>
            <p className="text-xs text-ink-400">
              Generate targeted diagnostic quizzes validated by Pydantic schemas and personalized to your weak areas.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-ink-300">Select Subject</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Physics", "Chemistry", "Biology", "Mathematics"].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-3.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      selectedSubject === subj
                        ? "bg-academic-950 border-academic-600 text-academic-300 ring-1 ring-academic-600"
                        : "bg-ink-950 border-ink-800 text-ink-400 hover:text-ink-200"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-300">Difficulty Level</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Easy", "Medium", "Hard", "Exam level"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`p-2 rounded border text-xs text-center transition-colors ${
                        difficulty === lvl
                          ? "bg-academic-950 border-academic-600 text-academic-300"
                          : "bg-ink-950 border-ink-800 text-ink-400 hover:text-ink-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-300">Question Types</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["MCQ (Single Choice)", "Assertion-Reason", "Numerical", "HOTS & Multistep"].map((t, idx) => (
                    <div key={idx} className="p-2 rounded bg-ink-950 border border-ink-800 text-xs text-ink-300 flex items-center justify-between">
                      <span>{t}</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-academic-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-ink-800/80">
              <span className="text-xs text-ink-400 font-mono">5 Questions · ~15 Minutes Duration</span>
              <Button
                variant="academic"
                size="md"
                className="text-xs h-9 font-semibold gap-1.5"
                onClick={() => {
                  setIsGenerating(true);
                  setTimeout(() => setIsGenerating(false), 800);
                }}
                isLoading={isGenerating}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Adaptive Practice Set</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Quiz Preview Sample */}
        <Card className="border-academic-800/40 bg-ink-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="academic" className="text-[10px] font-mono uppercase">Physics</Badge>
                <span className="text-xs font-mono text-ink-500">Question 1 of 5</span>
              </div>
              <CardTitle className="text-sm font-semibold text-ink-100 mt-1">
                Rotational Dynamics & Incline Acceleration
              </CardTitle>
            </div>
            <Badge variant="danger" className="text-[10px] font-mono">Exam Level</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-ink-200 leading-relaxed font-medium">
              A solid uniform cylinder of mass $M$ and radius $R$ rolls without slipping down a plane inclined at angle $\theta$ to the horizontal. What is the linear acceleration of the center of mass of the cylinder?
            </p>

            <div className="space-y-2">
              {[
                { id: "A", text: "(1/2) g sin θ" },
                { id: "B", text: "(2/3) g sin θ", correct: true },
                { id: "C", text: "(3/4) g sin θ" },
                { id: "D", text: "g sin θ" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-md border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    opt.correct
                      ? "bg-academic-950/60 border-academic-600 text-academic-200"
                      : "bg-ink-950/80 border-ink-800 text-ink-300 hover:border-ink-700"
                  }`}
                >
                  <span><strong>{opt.id})</strong> {opt.text}</span>
                  {opt.correct && <Badge variant="academic" className="text-[9px]">Verified Correct</Badge>}
                </div>
              ))}
            </div>

            <div className="p-3 rounded bg-ink-950 border border-ink-800 text-[11px] text-ink-400 space-y-1">
              <strong className="text-academic-400 font-mono">Pedagogical Derivation:</strong>
              <p>{"Using a = g sin(θ) / (1 + I/(MR²)) with I = (1/2)MR² gives a = (2/3) g sin(θ)."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
