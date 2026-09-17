"use client";

import React, { useState } from "react";
import { HelpCircle, Play, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Flag, Clock, Check } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PracticePage() {
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState("Exam level");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>("B");

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Adaptive Practice</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Personalized diagnostic test generator. Calibrated to eliminate weak concepts identified by Mistake Intelligence.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Select Subject</label>
              <div className="flex flex-wrap gap-2.5 mt-2.5">
                {["Physics", "Chemistry", "Biology", "Mathematics"].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      selectedSubject === subj
                        ? "bg-[#FF5734] text-white shadow-sm"
                        : "bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Difficulty Level</label>
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  {["Easy", "Medium", "Hard", "Exam level"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                        difficulty === lvl
                          ? "bg-[#F0E9FD] border-[#E0D1FB] text-[#6C38D4] shadow-subtle"
                          : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Question Formats</label>
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  {["MCQ (Single Choice)", "Assertion-Reason", "Numerical", "HOTS & Multi-step"].map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#151515] font-semibold flex items-center justify-between">
                      <span className="truncate">{t}</span>
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EFEFE8]">
              <div className="flex items-center gap-2 text-xs text-[#707070]">
                <Clock className="h-4 w-4 text-[#FF5734]" />
                <span className="font-semibold">5 Questions • ~15 Minutes Duration</span>
              </div>
              <Button
                variant="primary"
                size="md"
                className="text-xs sm:text-sm h-11 px-6 font-bold gap-2 shadow-sm"
                onClick={() => {
                  setIsGenerating(true);
                  setTimeout(() => setIsGenerating(false), 700);
                }}
                isLoading={isGenerating}
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Adaptive Practice Set</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Live Examination Question Card */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E6DE]">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="coral" className="text-[10px] font-bold uppercase">PHYSICS</Badge>
                <span className="text-xs text-[#707070] font-semibold">Question 1 of 5</span>
              </div>
              <h3 className="text-lg font-display font-bold text-[#151515] mt-1">
                Rotational Dynamics & Incline Acceleration
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="yellow" className="text-xs font-bold">Exam Level</Badge>
              <button className="flex items-center gap-1 text-xs text-[#707070] hover:text-[#FF5734] px-2.5 py-1 rounded-full border border-[#E8E6DE]">
                <Flag className="h-3.5 w-3.5" /> Flag
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm sm:text-base text-[#151515] leading-relaxed font-medium bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E6DE]">
              A solid uniform cylinder of mass <em>M</em> and radius <em>R</em> rolls without slipping down a plane inclined at angle <em>&theta;</em> to the horizontal. What is the linear acceleration of the center of mass of the cylinder?
            </p>

            <div className="space-y-3">
              {[
                { id: "A", text: "(1/2) g sin θ" },
                { id: "B", text: "(2/3) g sin θ", correct: true },
                { id: "C", text: "(3/4) g sin θ" },
                { id: "D", text: "g sin θ" },
              ].map((opt) => {
                const isSelected = selectedOption === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#F0FDF4] border-[#16A34A] text-[#166534] shadow-subtle"
                        : "bg-white border-[#E8E6DE] text-[#151515] hover:border-[#D2CFC2] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? "bg-[#16A34A] text-white" : "bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555]"
                      }`}>
                        {opt.id}
                      </div>
                      <span>{opt.text}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#166534] bg-white px-2.5 py-1 rounded-full border border-[#BBF7D0]">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Derivation / Explanation Box */}
            <div className="p-4 rounded-2xl bg-[#FFF9D6] border border-[#FFF1A3] text-xs text-[#8F6E00] space-y-1">
              <strong className="font-bold text-[#151515]">Step-by-Step Derivation:</strong>
              <p className="text-[#151515]/80 leading-relaxed">
                Using <code>a = g sin(θ) / (1 + I / (M R²))</code> with cylinder moment of inertia <code>I = (1/2) M R²</code>:
                <br />
                <code>a = g sin(θ) / (1 + 1/2) = (2/3) g sin(θ)</code>.
              </p>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 flex items-center justify-between border-t border-[#E8E6DE]">
              <Button variant="outline" size="sm" className="text-xs h-9 font-bold border-[#E4E2D8]">
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-9 font-bold border-[#E4E2D8]">
                  Save & Next
                </Button>
                <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
                  Submit Test →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
