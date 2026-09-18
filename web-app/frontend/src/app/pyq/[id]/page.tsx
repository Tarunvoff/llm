"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Zap,
  Sigma,
  HelpCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { MathRenderer, LaTeXBlock } from "@/components/ui/math-renderer";

export default function PYQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [pyq, setPyq] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPYQ() {
      try {
        const data = await ApiClient.getPYQDetails(resolvedParams.id);
        setPyq(data);
        if (data.user_attempt) {
          setSelectedOption(data.user_attempt.selected_option);
          setSubmitResult({
            is_correct: data.user_attempt.is_correct,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            key_formula_used: data.key_formula_used,
            recurring_pattern: data.recurring_pattern_tag,
          });
        }
      } catch (err) {
        console.error("Failed to load PYQ details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPYQ();
  }, [resolvedParams.id]);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    try {
      const res = await ApiClient.submitPYQAttempt(resolvedParams.id, {
        selected_option: selectedOption,
        time_taken_seconds: 40,
      });
      setSubmitResult(res);
    } catch (err: any) {
      alert(err.message || "Failed to submit attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-xs text-[#707070]">Loading question...</div>
      </AppShell>
    );
  }

  if (!pyq) {
    return (
      <AppShell>
        <div className="py-16 text-center text-xs text-[#707070]">Question not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Link href="/pyq" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#707070] hover:text-[#151515]">
          <ArrowLeft className="h-4 w-4" /> Back to PYQ Archive
        </Link>
        <Badge className="bg-[#151515] text-white text-xs font-bold">
          {pyq.exam_name} {pyq.year}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Solver */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white border-[#E8E6DE] shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E8E6DE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#707070]">
                  {pyq.subject} · {pyq.chapter} · {pyq.topic}
                </span>
                {pyq.recurring_pattern_tag && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#8F6E00] bg-[#FFF9D6] px-2.5 py-0.5 rounded-full border border-[#FFF1A3]">
                    <Zap className="h-3 w-3 fill-[#FFCC42] text-[#FFCC42]" />
                    <span>Recurring Exam Trap ({pyq.repeat_frequency_score}x)</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="text-sm font-bold text-[#151515] leading-relaxed">
                <MathRenderer content={pyq.question_text} />
              </div>

              {/* Options List */}
              <div className="space-y-2.5">
                {pyq.options?.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  const isSubmitted = submitResult !== null;
                  const isCorrectAnswer = isSubmitted && opt === submitResult.correct_answer;
                  const isWrongSelected = isSubmitted && isSelected && !submitResult.is_correct;

                  let optClasses = "bg-[#FAF9F5] border-[#E8E6DE] text-[#151515] hover:bg-[#EFEFE8]";
                  if (isSelected && !isSubmitted) {
                    optClasses = "bg-[#FFF3F0] border-[#FF5734] text-[#BD3012] font-bold ring-1 ring-[#FF5734]";
                  } else if (isCorrectAnswer) {
                    optClasses = "bg-[#ECFDF5] border-[#10B981] text-[#047857] font-bold";
                  } else if (isWrongSelected) {
                    optClasses = "bg-[#FEF2F2] border-[#EF4444] text-[#B91C1C] font-bold";
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => !isSubmitted && setSelectedOption(opt)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer text-xs ${optClasses}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-white border border-[#E8E6DE] flex items-center justify-center font-bold text-[10px] shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="font-medium">
                          <MathRenderer content={opt} />
                        </div>
                      </div>
                      {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />}
                      {isWrongSelected && <XCircle className="h-4 w-4 text-[#EF4444] shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {!submitResult ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl py-3"
                >
                  {isSubmitting ? "Evaluating Attempt..." : "Check Answer"}
                </Button>
              ) : (
                <div className="p-4 rounded-2xl border bg-[#FAF9F5] border-[#E8E6DE] space-y-3 animate-in fade-in-0">
                  <div className="flex items-center gap-2">
                    {submitResult.is_correct ? (
                      <Badge className="bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
                        ✓ Correct Answer!
                      </Badge>
                    ) : (
                      <Badge className="bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]">
                        ✗ Incorrect Answer (Logged to Mistake Journal)
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#151515] mb-1">Step-by-Step Pedagogical Explanation:</h4>
                    <div className="text-xs text-[#555555] leading-relaxed">
                      <MathRenderer content={submitResult.explanation} />
                    </div>
                  </div>
                  {submitResult.key_formula_used && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8E6DE] text-xs font-bold text-[#BD3012] flex items-center gap-2">
                      <span className="text-[10px] text-[#707070] uppercase">Key Equation:</span>
                      <MathRenderer content={submitResult.key_formula_used} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Similar Questions */}
        <div className="space-y-4">
          {/* Related Formulas Card */}
          {pyq.related_formulas?.length > 0 && (
            <Card className="bg-white border-[#E8E6DE] p-4 space-y-2">
              <span className="text-xs font-bold text-[#151515] flex items-center gap-1.5">
                <Sigma className="h-3.5 w-3.5 text-[#FF5734]" /> Governing Formula
              </span>
              {pyq.related_formulas.map((rf: any, i: number) => (
                <div key={i} className="p-2.5 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl text-xs font-bold text-[#BD3012]">
                  <LaTeXBlock latex={rf.formula} displayMode={true} />
                </div>
              ))}
            </Card>
          )}

          {/* Topic 360 Center Link */}
          <Card className="bg-[#FFFDF7] border-[#FFF1A3] p-4 space-y-2">
            <span className="text-xs font-bold text-[#8F6E00]">Master this Concept</span>
            <p className="text-[11px] text-[#555555]">
              Explore videos, flashcards, diagrams, and notes on {pyq.topic}.
            </p>
            <Link href={`/topics/${encodeURIComponent(pyq.topic)}`}>
              <Button className="w-full bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl mt-2">
                Open Topic Center
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
