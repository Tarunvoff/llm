"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Sigma,
  Zap,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function ExamMemoryPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExamCram() {
      try {
        const res = await ApiClient.getExamMemoryCramMode("NEET");
        setData(res);
      } catch (err) {
        console.error("Failed to load exam memory cram mode:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExamCram();
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Exam Memory Cram Center
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Last-Mile Revision</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Top 1% recurring formulas, high-frequency PYQ traps, and common conceptual pitfalls in one concentrated dashboard.
          </p>
        </div>

        <Link href="/recall">
          <Button className="bg-[#FF5734] hover:bg-[#E04624] text-white text-xs font-bold gap-1.5 rounded-xl px-4 py-2">
            <Clock className="h-3.5 w-3.5" />
            Launch 10-Min Fast Recall
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading exam memory cram mode...</div>
      ) : (
        <div className="space-y-6">
          {/* Must-Know Formulas Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#BD3012] flex items-center gap-1.5">
              <Sigma className="h-4 w-4" /> HIGHEST-YIELD FORMULAS (APPEARS IN 80%+ OF PAPERS)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.must_know_formulas?.map((f: any) => (
                <Card key={f.id} className="bg-white border-[#E8E6DE] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#151515]">{f.title}</span>
                    <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC] text-[9px]">{f.subject}</Badge>
                  </div>
                  <div className="p-2.5 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl font-mono text-xs font-bold text-[#BD3012]">
                    {f.formula}
                  </div>
                  <p className="text-[10px] text-[#707070] truncate">{f.topic}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Recurring PYQ Patterns Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8F6E00] flex items-center gap-1.5">
              <Zap className="h-4 w-4 fill-[#FFCC42] text-[#FFCC42]" /> RECURRING PYQ PATTERNS (PAST 6 YEARS)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.recurring_pyq_patterns?.map((p: any) => (
                <Card key={p.id} className="bg-[#FFFDF7] border-[#FFF1A3] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#151515]">{p.pattern}</span>
                    <span className="text-[10px] font-bold text-[#8F6E00] bg-[#FFF9D6] px-2 py-0.5 rounded-md">
                      Frequency: {p.frequency}x
                    </span>
                  </div>
                  <p className="text-xs text-[#555555] italic">&quot;{p.sample_question}&quot;</p>
                  <div className="text-[10px] text-[#707070]">
                    Appeared in: {p.appeared_years?.join(", ")}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Trapped Mistakes Section */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#DC2626] flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> TRAPPED MISTAKES (AVOID THESE IN THE EXAM)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.high_priority_mistakes?.map((m: any) => (
                <Card key={m.id} className="bg-[#FFF5F5] border-[#FECACA] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#DC2626]">{m.concept}</span>
                    <Badge className="bg-[#FFF0F0] text-[#DC2626] border-[#FECACA] text-[9px]">{m.mistake_type}</Badge>
                  </div>
                  <p className="text-xs text-[#151515] font-semibold">{m.explanation}</p>
                  <p className="text-[11px] text-[#707070]">Correct Answer Rule: {m.correct_answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
