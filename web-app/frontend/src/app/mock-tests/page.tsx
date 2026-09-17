"use client";

import React from "react";
import { FileSpreadsheet, Play, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MockTestsPage() {
  const tests = [
    {
      id: "mock-1",
      title: "Full-Length Diagnostic Mock Test #1",
      exam: "NEET Full Syllabus",
      duration: "3 Hours",
      questions: 180,
      score: "612 / 720",
      accuracy: "85%",
      date: "Completed 3 days ago",
      status: "Completed",
    },
    {
      id: "mock-2",
      title: "Physics & Chemistry High-Yield Sectional",
      exam: "NEET Sectional",
      duration: "90 Min",
      questions: 90,
      score: "Upcoming",
      accuracy: "-",
      date: "Scheduled for Tomorrow 7 PM",
      status: "Upcoming",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Full-Length Mock Tests</h2>
            <p className="text-xs text-ink-400">
              Personalized exam simulations weighted against your weak topics, historical mistakes, and target syllabus.
            </p>
          </div>

          <Button variant="academic" size="sm" className="text-xs h-8 gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate Adaptive Mock Paper</span>
          </Button>
        </div>

        <div className="space-y-4">
          {tests.map((t) => (
            <Card key={t.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="academic" className="text-[10px] font-mono uppercase">{t.exam}</Badge>
                  <span className="text-[11px] text-ink-500 font-mono">{t.date}</span>
                </div>
                <Badge variant={t.status === "Completed" ? "academic" : "warning"} className="text-[10px] font-mono">
                  {t.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-100">{t.title}</h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  {t.questions} Questions · {t.duration} Duration
                </p>
              </div>

              {t.status === "Completed" ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded bg-ink-950 border border-ink-800 text-xs">
                  <div>
                    <span className="text-ink-500 text-[10px] font-mono uppercase">Score</span>
                    <p className="text-base font-bold font-mono text-academic-400">{t.score}</p>
                  </div>
                  <div>
                    <span className="text-ink-500 text-[10px] font-mono uppercase">Accuracy</span>
                    <p className="text-base font-bold font-mono text-ink-100">{t.accuracy}</p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <Button variant="academic" size="sm" className="text-xs h-8">
                    Start Mock Test <Play className="h-3 w-3 ml-1 fill-current" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
