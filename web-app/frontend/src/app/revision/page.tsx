"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, CheckCircle2, Clock, Calendar, ArrowRight, Sparkles, Check, Brain, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ApiClient } from "@/lib/api";

interface RevisionTopic {
  id: string;
  subject: string;
  topic: string;
  interval: string;
  dueDate?: string;
  isCompleted?: boolean;
}

interface RevisionBucket {
  stage: string;
  desc: string;
  count: number;
  variant: string;
  topics: RevisionTopic[];
}

export default function RevisionPage() {
  const [buckets, setBuckets] = useState<RevisionBucket[]>([]);
  const [totalDueToday, setTotalDueToday] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRevisionSchedule = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getRevisionSchedule();
      if (data && data.buckets) {
        setBuckets(data.buckets);
        setTotalDueToday(data.total_due_today || 0);
      }
    } catch (err) {
      console.warn("Using fallback revision buckets:", err);
      setBuckets([
        {
          stage: "Stage 1 (Today)",
          desc: "Immediate active recall after 24h",
          count: 2,
          variant: "coral",
          topics: [
            { id: "r1", subject: "Physics", topic: "Conservation of Angular Momentum", interval: "24h Interval" },
            { id: "r2", subject: "Biology", topic: "Cell Division (Mitosis vs Meiosis)", interval: "24h Interval" },
          ],
        },
        {
          stage: "Stage 2 (Tomorrow)",
          desc: "3-Day memory stabilization interval",
          count: 1,
          variant: "yellow",
          topics: [
            { id: "r3", subject: "Chemistry", topic: "Markovnikov Addition & Carbocations", interval: "3d Interval" },
          ],
        },
        {
          stage: "Stage 3 (In 7 Days)",
          desc: "Weekly consolidation interval",
          count: 3,
          variant: "lavender",
          topics: [
            { id: "r4", subject: "Physics", topic: "Work-Energy Theorem in Non-Conservative Fields", interval: "7d Interval" },
            { id: "r5", subject: "Biology", topic: "Enzyme Kinetics & Michaelis Constant", interval: "7d Interval" },
            { id: "r6", subject: "Chemistry", topic: "Thermodynamics & Enthalpy Calculation", interval: "7d Interval" },
          ],
        },
        {
          stage: "Stage 4 (In 30 Days)",
          desc: "Long-term permanent memory lock",
          count: 2,
          variant: "academic",
          topics: [
            { id: "r7", subject: "Physics", topic: "Kinematics 2D Projectile Equations", interval: "30d Interval" },
            { id: "r8", subject: "Chemistry", topic: "Periodic Trends & Electronegativity", interval: "30d Interval" },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisionSchedule();
  }, []);

  const handleCompleteTopic = async (itemId: string) => {
    try {
      await ApiClient.completeRevisionItem(itemId);
      fetchRevisionSchedule();
    } catch (err) {
      console.warn("Failed to advance revision topic stage:", err);
    }
  };

  const handleGenerateSmartTriggers = async () => {
    setIsGenerating(true);
    try {
      await ApiClient.generateRevisionSchedule();
      await fetchRevisionSchedule();
    } catch (err) {
      console.warn("Generate smart triggers error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Spaced Repetition Engine</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Ebbinghaus forgetting curve optimizer. Reviews weak topics at 24h, 3d, 7d, and 30d intervals for permanent neural retention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 font-bold border-[#151515] gap-1.5"
              onClick={handleGenerateSmartTriggers}
              isLoading={isGenerating}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF5734]" />
              <span>Sync Mistake Triggers</span>
            </Button>
            <a href="/practice">
              <Button variant="primary" size="sm" className="text-xs h-9 font-bold shadow-sm">
                Start Today's Review ({totalDueToday} Due)
              </Button>
            </a>
          </div>
        </div>

        {/* 4-Stage Spaced Repetition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {buckets.map((b, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={b.variant as any} className="text-xs font-bold px-3 py-1">
                    {b.stage}
                  </Badge>
                  <span className="text-xs font-bold text-[#707070]">
                    {b.topics.length} Concept{b.topics.length === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="text-xs text-[#555555] font-medium">{b.desc}</p>

                <div className="space-y-2.5 pt-2">
                  {b.topics.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#707070] text-center">
                      No topics due in this interval bucket.
                    </div>
                  ) : (
                    b.topics.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] flex items-center justify-between gap-3 hover:border-[#151515] transition-all"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5734]">
                            {t.subject}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-[#151515]">{t.topic}</p>
                          <span className="text-[11px] text-[#707070] block font-medium">{t.interval}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a href="/practice">
                            <button className="h-8 px-2.5 rounded-xl border border-[#E8E6DE] bg-white text-[11px] font-bold text-[#151515] hover:border-[#151515]">
                              Practice
                            </button>
                          </a>
                          <button
                            onClick={() => handleCompleteTopic(t.id)}
                            className="h-8 w-8 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center hover:bg-[#16A34A] hover:text-white transition-all"
                            title="Mark Reviewed / Advance Stage"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFEFE8] flex items-center justify-between text-xs text-[#707070]">
                <span>Interval Calibration</span>
                <span className="font-bold text-[#151515]">SuperMemo-2 Adaptive Algorithm</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
