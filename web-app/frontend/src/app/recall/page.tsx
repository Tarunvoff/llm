"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Timer,
  Sigma,
  Layers,
  Flame,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function QuickRecallPage() {
  const [duration, setDuration] = useState<number>(10);
  const [session, setSession] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"formulas" | "flashcards" | "mistakes" | "pyqs">("formulas");
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getQuickRecallSession(duration);
      setSession(res);
      setCompletedItems({});
    } catch (err) {
      console.error("Failed to load recall session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [duration]);

  const toggleItemDone = (id: string) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalDone = Object.values(completedItems).filter(Boolean).length;
  const totalItems = session?.total_items || 1;
  const progressPct = Math.min(100, Math.round((totalDone / totalItems) * 100));

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Quick Recall Mode
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Timed Sprint</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Automated rapid revision drill combining high-yield formulas, flashcards, trapped mistakes, and PYQs.
          </p>
        </div>

        {/* Duration Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E6DE]">
          {[10, 20, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                duration === d
                  ? "bg-[#151515] text-white shadow-xs"
                  : "text-[#707070] hover:text-[#151515]"
              }`}
            >
              {d} Minutes
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#151515]">Sprint Progress</span>
          <span className="text-[#BD3012]">{totalDone} / {totalItems} Items Checked ({progressPct}%)</span>
        </div>
        <div className="h-2.5 w-full bg-[#FAF9F5] rounded-full overflow-hidden border border-[#E8E6DE]">
          <div
            className="h-full bg-[#FF5734] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E6DE] pb-2">
        <button
          onClick={() => setActiveTab("formulas")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "formulas"
              ? "bg-[#FFF3F0] text-[#BD3012] border border-[#FFC8BC]"
              : "text-[#707070] hover:text-[#151515]"
          }`}
        >
          Formulas ({session?.formulas?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "flashcards"
              ? "bg-[#F0E9FD] text-[#6C38D4] border border-[#E0D1FB]"
              : "text-[#707070] hover:text-[#151515]"
          }`}
        >
          Flashcards ({session?.flashcards?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("mistakes")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "mistakes"
              ? "bg-[#FFF0F0] text-[#DC2626] border border-[#FECACA]"
              : "text-[#707070] hover:text-[#151515]"
          }`}
        >
          Mistakes ({session?.mistakes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("pyqs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "pyqs"
              ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
              : "text-[#707070] hover:text-[#151515]"
          }`}
        >
          PYQ Drills ({session?.pyqs?.length || 0})
        </button>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Calibrating recall sprint...</div>
      ) : (
        <div className="space-y-4">
          {activeTab === "formulas" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session?.formulas?.map((f: any) => {
                const isDone = !!completedItems[f.id];
                return (
                  <Card key={f.id} className={`border transition-all ${isDone ? "bg-[#FAF9F5] opacity-60" : "bg-white border-[#E8E6DE]"}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#151515]">{f.title}</span>
                        <button
                          onClick={() => toggleItemDone(f.id)}
                          className={`p-1 rounded-lg border transition-colors ${
                            isDone ? "bg-[#10B981] text-white border-[#10B981]" : "bg-white text-[#707070] border-[#E8E6DE]"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-3 bg-[#FAF9F5] rounded-xl font-mono text-xs font-bold text-[#BD3012] border border-[#E8E6DE]">
                        {f.formula}
                      </div>
                      <span className="text-[10px] text-[#707070] block">{f.topic}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session?.flashcards?.map((fc: any) => {
                const isDone = !!completedItems[fc.id];
                return (
                  <Card key={fc.id} className={`border transition-all ${isDone ? "bg-[#FAF9F5] opacity-60" : "bg-white border-[#E8E6DE]"}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#151515]">{fc.front}</p>
                        <button
                          onClick={() => toggleItemDone(fc.id)}
                          className={`p-1 rounded-lg border transition-colors shrink-0 ${
                            isDone ? "bg-[#10B981] text-white border-[#10B981]" : "bg-white text-[#707070] border-[#E8E6DE]"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-3 bg-[#F0E9FD] rounded-xl text-xs text-[#6C38D4] font-medium">
                        {fc.back}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === "mistakes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session?.mistakes?.map((m: any) => {
                const isDone = !!completedItems[m.id];
                return (
                  <Card key={m.id} className={`border transition-all ${isDone ? "bg-[#FAF9F5] opacity-60" : "bg-white border-[#E8E6DE]"}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#DC2626]">{m.concept}</span>
                        <button
                          onClick={() => toggleItemDone(m.id)}
                          className={`p-1 rounded-lg border transition-colors shrink-0 ${
                            isDone ? "bg-[#10B981] text-white border-[#10B981]" : "bg-white text-[#707070] border-[#E8E6DE]"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#151515] font-medium">{m.explanation}</p>
                      <span className="text-[10px] text-[#707070] block">Rule: {m.correct_answer}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === "pyqs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session?.pyqs?.map((p: any) => {
                const isDone = !!completedItems[p.id];
                return (
                  <Card key={p.id} className={`border transition-all ${isDone ? "bg-[#FAF9F5] opacity-60" : "bg-white border-[#E8E6DE]"}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#151515] text-white text-[9px]">{p.exam_name} {p.year}</Badge>
                        <button
                          onClick={() => toggleItemDone(p.id)}
                          className={`p-1 rounded-lg border transition-colors ${
                            isDone ? "bg-[#10B981] text-white border-[#10B981]" : "bg-white text-[#707070] border-[#E8E6DE]"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-[#151515] leading-relaxed">{p.question_text}</p>
                      <div className="p-2.5 bg-[#FAF9F5] rounded-xl text-xs text-[#047857] font-semibold">
                        Correct: {p.correct_answer}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
