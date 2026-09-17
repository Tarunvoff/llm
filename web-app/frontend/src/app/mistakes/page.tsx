"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, Filter, Search, ArrowRight, Check, Sparkles, Trash2, Brain } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { ApiClient } from "@/lib/api";

interface MistakeItem {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  concept: string;
  subject: string;
  topic: string;
  mistakeType: string;
  isResolved: boolean;
  retestCount?: number;
  retestScheduled?: string;
  createdAt?: string;
}

interface MistakeStats {
  total: number;
  resolved: number;
  unresolved: number;
  conceptual: number;
  calculation: number;
  memory: number;
  careless: number;
}

export default function MistakesPage() {
  const [filterType, setFilterType] = useState("All");
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [stats, setStats] = useState<MistakeStats>({
    total: 3,
    resolved: 1,
    unresolved: 2,
    conceptual: 2,
    calculation: 0,
    memory: 1,
    careless: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRetesting, setIsRetesting] = useState(false);

  const fetchMistakes = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getMistakes();
      if (data) {
        if (data.mistakes) setMistakes(data.mistakes);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch mistakes, using baseline state:", err);
      setMistakes([
        {
          id: "m1",
          subject: "Physics",
          topic: "Rotational Motion",
          concept: "Radian to Revolution Angular Acceleration Conversion",
          mistakeType: "Conceptual",
          question: "A rigid body rotates about a fixed axis with constant angular acceleration α. If it makes N revolutions in time t, find α.",
          userAnswer: "α = 2πN / t² (Missed factor of 2 during radian conversion)",
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const handleToggleResolve = async (id: string) => {
    try {
      const data = await ApiClient.toggleResolveMistake(id);
      if (data) {
        setMistakes((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isResolved: data.is_resolved } : m))
        );
        setStats((prev) => ({
          ...prev,
          resolved: data.is_resolved ? prev.resolved + 1 : prev.resolved - 1,
          unresolved: data.is_resolved ? prev.unresolved - 1 : prev.unresolved + 1,
        }));
      }
    } catch (err) {
      setMistakes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isResolved: !m.isResolved } : m))
      );
    }
  };

  const handleStartRetest = async () => {
    setIsRetesting(true);
    try {
      await ApiClient.retestMistakes();
      window.location.href = "/practice";
    } catch (err) {
      console.warn("Retest redirect fallback:", err);
      window.location.href = "/practice";
    } finally {
      setIsRetesting(false);
    }
  };

  const filteredMistakes = filterType === "All"
    ? mistakes
    : filterType === "Unresolved"
    ? mistakes.filter((m) => !m.isResolved)
    : filterType === "Resolved"
    ? mistakes.filter((m) => m.isResolved)
    : mistakes.filter((m) => m.mistakeType.toLowerCase() === filterType.toLowerCase());

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Mistake Notebook</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Intelligent misconception catalog. Automatically aggregates conceptual, calculation, and memory traps from practice sessions.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="text-xs h-9 gap-2 font-bold shadow-sm"
            onClick={handleStartRetest}
            isLoading={isRetesting}
          >
            <Sparkles className="h-4 w-4" />
            <span>Start Smart Retest ({stats.unresolved} Due)</span>
          </Button>
        </div>

        {/* Stats Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#FFF3F0] border-2 border-[#151515] p-4 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BD3012]">Unresolved Mistakes</span>
            <p className="text-2xl font-display font-bold text-[#FF5734]">{stats.unresolved}</p>
            <p className="text-[11px] text-[#707070]">Requires retest confirmation</p>
          </div>

          <div className="bg-[#F0FDF4] border-2 border-[#151515] p-4 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Resolved & Retested</span>
            <p className="text-2xl font-display font-bold text-[#16A34A]">{stats.resolved}</p>
            <p className="text-[11px] text-[#166534] font-medium">Concept mastered</p>
          </div>

          <div className="bg-[#F0E9FD] border-2 border-[#151515] p-4 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C38D4]">Conceptual Traps</span>
            <p className="text-2xl font-display font-bold text-[#6C38D4]">{stats.conceptual}</p>
            <p className="text-[11px] text-[#707070]">High pedagogical priority</p>
          </div>

          <div className="bg-[#FFF9D6] border-2 border-[#151515] p-4 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6E00]">Memory / Recall</span>
            <p className="text-2xl font-display font-bold text-[#8F6E00]">{stats.memory + stats.calculation}</p>
            <p className="text-[11px] text-[#707070]">Spaced repetition active</p>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Unresolved", "Resolved", "Conceptual", "Calculation", "Memory"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filterType.toLowerCase() === tab.toLowerCase()
                  ? "bg-[#151515] text-white shadow-sm"
                  : "bg-white border border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:border-[#151515]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mistakes List */}
        <div className="space-y-4">
          {filteredMistakes.length === 0 ? (
            <div className="bg-white border-2 border-[#151515] rounded-3xl p-10 text-center space-y-3 shadow-[4px_4px_0px_0px_#151515]">
              <CheckCircle2 className="h-10 w-10 text-[#16A34A] mx-auto" />
              <h3 className="text-lg font-display font-bold text-[#151515]">No Mistakes in this Category!</h3>
              <p className="text-xs text-[#555555] max-w-md mx-auto">
                All logged questions in this category are resolved or you haven't made errors here yet. Keep up the high retention rate!
              </p>
            </div>
          ) : (
            filteredMistakes.map((m) => (
              <div
                key={m.id}
                className="bg-white border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4 transition-all hover:shadow-[6px_6px_0px_0px_#151515]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFEFE8]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.subject === "Physics" ? "coral" : m.subject === "Chemistry" ? "yellow" : "academic"} className="text-[10px] font-bold uppercase">
                      {m.subject}
                    </Badge>
                    <span className="text-xs text-[#707070] font-semibold">• {m.topic}</span>
                    <Badge variant="outline" className="text-[10px] border-[#E8E6DE]">
                      {m.mistakeType} Error
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      m.isResolved ? "bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]" : "bg-[#FFF3F0] text-[#FF5734] border border-[#FFD9D0]"
                    }`}>
                      {m.isResolved ? "Resolved" : "Retest Due Today"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#151515] mb-2 leading-relaxed">
                    {m.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="p-3.5 rounded-2xl bg-[#FFF3F0] border border-[#FFD9D0] text-xs font-semibold text-[#BD3012]">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-[#707070]">What you answered:</span>
                      <span className="mt-1 block">{m.userAnswer}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#166534]">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-[#707070]">Authoritative Correct Answer:</span>
                      <span className="mt-1 block">{m.correctAnswer}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9D6] border border-[#FFF1A3] text-xs text-[#8F6E00] space-y-1">
                  <strong className="font-bold text-[#151515]">Concept Diagnosis & Fix:</strong>
                  <p className="text-[#151515]/90 leading-relaxed">{m.explanation}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#707070]">
                    Concept Tag: <strong className="text-[#151515]">{m.concept}</strong>
                  </span>

                  <Button
                    variant={m.isResolved ? "outline" : "primary"}
                    size="sm"
                    className="text-xs h-8 font-bold gap-1.5"
                    onClick={() => handleToggleResolve(m.id)}
                  >
                    {m.isResolved ? (
                      <>
                        <RotateCcw className="h-3 w-3" />
                        <span>Re-open for Retest</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Mark as Mastered</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
