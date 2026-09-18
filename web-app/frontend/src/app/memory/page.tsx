"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sigma,
  Brain,
  Timer,
  BookOpen,
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  Bookmark,
  Layers,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function MemoryVaultPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await ApiClient.getMemoryOverview();
        setOverview(res);
      } catch (err) {
        console.error("Failed to load memory vault:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Formula & Memory Vault
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">At Your Fingertips</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Immediate access to equations, high-yield reactions, constant values, and rapid recall drills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/recall">
            <Button className="bg-[#FF5734] hover:bg-[#E04624] text-white text-xs font-bold gap-1.5 rounded-xl px-4 py-2">
              <Timer className="h-3.5 w-3.5 fill-white" />
              10-Min Rapid Recall
            </Button>
          </Link>
          <Link href="/memory/exam">
            <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold gap-1.5 rounded-xl px-4 py-2">
              <Flame className="h-3.5 w-3.5 text-[#FFCC42]" />
              Exam Cram Mode
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/memory/formulas" className="group">
          <Card className="bg-white border-[#E8E6DE] group-hover:border-[#FFC8BC] transition-all p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Sigma className="h-6 w-6 text-[#FF5734]" />
              <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#FF5734] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-black text-[#151515] mt-3">{overview?.summary?.total_formulas || 12}</p>
            <span className="text-xs font-bold text-[#707070]">Formula Bank</span>
          </Card>
        </Link>

        <Link href="/flashcards" className="group">
          <Card className="bg-white border-[#E8E6DE] group-hover:border-[#DDD6FE] transition-all p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Layers className="h-6 w-6 text-[#8B5CF6]" />
              <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-black text-[#151515] mt-3">{overview?.summary?.cards_due_for_recall || 5}</p>
            <span className="text-xs font-bold text-[#707070]">Cards Due Today</span>
          </Card>
        </Link>

        <Link href="/mistakes" className="group">
          <Card className="bg-white border-[#E8E6DE] group-hover:border-[#FECACA] transition-all p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Flame className="h-6 w-6 text-[#DC2626]" />
              <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-black text-[#151515] mt-3">{overview?.summary?.mistakes_to_review || 3}</p>
            <span className="text-xs font-bold text-[#707070]">Trapped Mistakes</span>
          </Card>
        </Link>

        <Link href="/pyq" className="group">
          <Card className="bg-white border-[#E8E6DE] group-hover:border-[#BBF7D0] transition-all p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Zap className="h-6 w-6 text-[#10B981]" />
              <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-2xl font-black text-[#151515] mt-3">37 Yrs</p>
            <span className="text-xs font-bold text-[#707070]">PYQ Trend Radar</span>
          </Card>
        </Link>
      </div>

      {/* Featured High-Yield Formulas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#151515] flex items-center gap-1.5">
            <Sigma className="h-4 w-4 text-[#FF5734]" /> Top High-Yield Formulas
          </h2>
          <Link href="/memory/formulas" className="text-xs font-bold text-[#FF5734] hover:underline flex items-center gap-1">
            View All Formulas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview?.recent_formulas?.map((f: any) => (
            <Card key={f.id} className="bg-white border-[#E8E6DE] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#151515]">{f.title}</span>
                <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">{f.subject}</Badge>
              </div>
              <div className="p-2.5 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl font-mono text-xs font-bold text-[#BD3012]">
                {f.formula_equation}
              </div>
              <p className="text-[11px] text-[#707070]">{f.topic}</p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
