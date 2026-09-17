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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Full-Length Mock Tests</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Personalized exam simulations calibrated to your syllabus, historical mistakes, and target exam.
            </p>
          </div>

          <Button variant="primary" size="sm" className="text-xs h-9 gap-2 font-bold shadow-sm">
            <Sparkles className="h-4 w-4" />
            <span>Generate Adaptive Mock Paper</span>
          </Button>
        </div>

        <div className="space-y-5">
          {tests.map((t) => (
            <div
              key={t.id}
              className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#151515] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFEFE8]">
                <div className="flex items-center gap-2.5">
                  <Badge variant="coral" className="text-xs font-bold uppercase">{t.exam}</Badge>
                  <span className="text-xs text-[#707070] font-medium">{t.date}</span>
                </div>
                <Badge variant={t.status === "Completed" ? "academic" : "yellow"} className="text-xs font-bold self-start sm:self-auto">
                  {t.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-display font-bold text-[#151515]">{t.title}</h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  {t.questions} Questions • {t.duration} Duration
                </p>
              </div>

              {t.status === "Completed" ? (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs">
                  <div>
                    <span className="text-[#707070] text-[11px] font-bold uppercase">Score</span>
                    <p className="text-xl font-display font-bold text-[#166534] mt-0.5">{t.score}</p>
                  </div>
                  <div>
                    <span className="text-[#707070] text-[11px] font-bold uppercase">Accuracy</span>
                    <p className="text-xl font-display font-bold text-[#151515] mt-0.5">{t.accuracy}</p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
                    Start Mock Test <Play className="h-3.5 w-3.5 ml-1.5 fill-white" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
