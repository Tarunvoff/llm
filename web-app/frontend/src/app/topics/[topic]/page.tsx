"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Brain,
  BookOpen,
  Film,
  Sparkles,
  Sigma,
  Layers,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle2,
  Zap,
  Compass,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function TopicCenterPage({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = use(params);
  const topicName = decodeURIComponent(resolvedParams.topic);
  const [overview, setOverview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTopic() {
      try {
        const res = await ApiClient.getTopicOverview(topicName);
        setOverview(res.overview);
      } catch (err) {
        console.error("Failed to load topic overview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTopic();
  }, [topicName]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-xs text-[#707070]">Loading topic center...</div>
      </AppShell>
    );
  }

  if (!overview) {
    return (
      <AppShell>
        <div className="py-16 text-center text-xs text-[#707070]">Topic not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E6DE] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">
                {overview.subject} · {overview.chapter}
              </Badge>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                overview.status === "Mastered"
                  ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                  : "bg-[#FFF9D6] text-[#8F6E00] border-[#FFF1A3]"
              }`}>
                {overview.status}
              </span>
            </div>
            <h1 className="font-display text-2xl font-black text-[#151515]">
              {overview.topic}
            </h1>
            <p className="text-xs text-[#707070]">{overview.learn.summary}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#707070] uppercase">TOPIC MASTERY</span>
              <p className="text-2xl font-black text-[#151515]">{int(overview.mastery_percentage)}%</p>
            </div>
            <Link href={`/tutor?prompt=${encodeURIComponent(`Explain the core principles and exam patterns of ${overview.topic}`)}`}>
              <Button className="bg-[#FF5734] hover:bg-[#E04624] text-white text-xs font-bold gap-1.5 rounded-xl px-5 py-2.5 shadow-sm">
                <Brain className="h-4 w-4" /> Ask AI Tutor
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Action Navigation Strip */}
        <div className="pt-3 border-t border-[#EFEFE8] flex items-center gap-2 overflow-x-auto pb-1">
          <Link href="#formulas" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            Formulas ({overview.remember.formula_count})
          </Link>
          <Link href="#flashcards" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            Flashcards ({overview.remember.flashcards_count})
          </Link>
          <Link href="#pyqs" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            PYQs ({overview.practice.pyqs_count})
          </Link>
          <Link href="#videos" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            Videos ({overview.watch.recommended_videos_count})
          </Link>
          <Link href="#diagrams" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            Diagrams ({overview.visualize.diagrams_count})
          </Link>
          <Link href="#mistakes" className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:bg-[#EFEFE8] shrink-0">
            Mistakes ({overview.mistakes.total_mistakes})
          </Link>
        </div>
      </div>

      {/* Grid of Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Remember: Formulas */}
        <Card id="formulas" className="bg-white border-[#E8E6DE] shadow-xs">
          <CardHeader className="pb-3 border-b border-[#EFEFE8] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#151515] flex items-center gap-2">
              <Sigma className="h-4 w-4 text-[#FF5734]" /> Governing Formulas
            </CardTitle>
            <Link href="/memory/formulas" className="text-xs font-bold text-[#FF5734] hover:underline">
              View Bank →
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {overview.remember.formulas.length > 0 ? (
              overview.remember.formulas.map((f: any) => (
                <div key={f.id} className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DE] space-y-1">
                  <span className="text-xs font-bold text-[#151515] block">{f.title}</span>
                  <div className="p-2 bg-white rounded-xl border border-[#E8E6DE] font-mono text-xs font-bold text-[#BD3012]">
                    {f.formula}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#707070]">No specific formulas extracted yet.</p>
            )}
          </CardContent>
        </Card>

        {/* 2. Remember: Flashcards */}
        <Card id="flashcards" className="bg-white border-[#E8E6DE] shadow-xs">
          <CardHeader className="pb-3 border-b border-[#EFEFE8] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#151515] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#8B5CF6]" /> Smart Flashcards
            </CardTitle>
            <Link href="/flashcards" className="text-xs font-bold text-[#8B5CF6] hover:underline">
              Recall Deck →
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#F0E9FD] rounded-2xl border border-[#E0D1FB]">
              <div>
                <p className="text-xs font-bold text-[#6C38D4]">
                  {overview.remember.flashcards_count} Active Recall Cards
                </p>
                <span className="text-[11px] text-[#6C38D4]/80">
                  {overview.remember.flashcards_due} cards due today for spaced repetition.
                </span>
              </div>
              <Link href="/flashcards">
                <Button className="bg-[#6C38D4] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl px-3 py-1.5">
                  Start Drill
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. Practice: Previous Year Questions */}
        <Card id="pyqs" className="bg-white border-[#E8E6DE] shadow-xs">
          <CardHeader className="pb-3 border-b border-[#EFEFE8] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#151515] flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#10B981]" /> PYQ Exam Questions
            </CardTitle>
            <Link href="/pyq" className="text-xs font-bold text-[#10B981] hover:underline">
              All PYQs →
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {overview.practice.pyqs.map((p: any) => (
              <div key={p.id} className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DE] space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#151515] text-white text-[9px]">{p.exam_name} {p.year}</Badge>
                  {p.recurring_pattern && (
                    <span className="text-[10px] font-bold text-[#8F6E00]">★ Recurring Trap</span>
                  )}
                </div>
                <p className="text-xs font-medium text-[#151515] line-clamp-2">{p.question_text}</p>
                <Link href={`/pyq/${p.id}`} className="text-[11px] font-bold text-[#FF5734] hover:underline inline-block">
                  Solve Question →
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 4. Watch: Recommended Videos */}
        <Card id="videos" className="bg-white border-[#E8E6DE] shadow-xs">
          <CardHeader className="pb-3 border-b border-[#EFEFE8] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#151515] flex items-center gap-2">
              <Film className="h-4 w-4 text-[#E5A100]" /> Recommended Lectures
            </CardTitle>
            <Link href="/resources/videos" className="text-xs font-bold text-[#E5A100] hover:underline">
              All Videos →
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {overview.watch.videos.map((v: any) => (
              <div key={v.id} className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E6DE] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#151515] block line-clamp-1">{v.title}</span>
                  <span className="text-[10px] text-[#707070]">{v.channel} · {v.duration_minutes}m ({v.style})</span>
                </div>
                <a href={v.video_id_or_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl px-3 py-1">
                    <Play className="h-3 w-3 fill-white" />
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function int(val: any) {
  return Math.round(Number(val) || 0);
}
