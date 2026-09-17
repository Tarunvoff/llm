"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlannerPage() {
  const days = [
    { name: "Monday", date: "Sep 22", isToday: true },
    { name: "Tuesday", date: "Sep 23", isToday: false },
    { name: "Wednesday", date: "Sep 24", isToday: false },
    { name: "Thursday", date: "Sep 25", isToday: false },
    { name: "Friday", date: "Sep 26", isToday: false },
  ];

  const planSessions = [
    { day: "Monday", time: "08:00", subject: "Biology", topic: "Cell Division (Mitosis & Meiosis)", duration: "45 min", type: "Study", completed: true },
    { day: "Monday", time: "10:30", subject: "Physics", topic: "Kinematics Practice Problem Set", duration: "60 min", type: "Practice", completed: false },
    { day: "Monday", time: "14:00", subject: "Chemistry", topic: "Electrophilic Addition Reactions", duration: "45 min", type: "Study", completed: false },
    { day: "Monday", time: "18:00", subject: "Physics", topic: "Rotational Motion Mistake Review", duration: "30 min", type: "Revision", completed: false },
    { day: "Monday", time: "20:00", subject: "Biology", topic: "Diagnostic Quiz on Cell Cycle", duration: "45 min", type: "Mock", completed: false },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Study Planner</h2>
            <p className="text-xs text-ink-400">
              Personalized 45-day roadmap automatically adjusted for syllabus coverage and upcoming revision triggers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 border-ink-700">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-academic-400" />
              Re-optimize Plan
            </Button>
            <Button variant="academic" size="sm" className="text-xs h-8">
              + Add Session
            </Button>
          </div>
        </div>

        {/* Days Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {days.map((d, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-center transition-all ${
                d.isToday
                  ? "bg-academic-950/60 border-academic-600 text-white ring-1 ring-academic-600"
                  : "bg-ink-900/60 border-ink-800 text-ink-400"
              }`}
            >
              <p className="text-xs font-semibold">{d.name}</p>
              <p className="text-[10px] font-mono text-ink-500 mt-0.5">{d.date}</p>
              {d.isToday && <Badge variant="academic" className="text-[9px] mt-1.5 py-0 px-1">Today</Badge>}
            </div>
          ))}
        </div>

        {/* Schedule List */}
        <Card className="space-y-3">
          <CardHeader className="pb-3 border-b border-ink-800">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ink-300 font-mono">
              Monday Study Timeline (3.5h Planned)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planSessions.map((s, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-md border flex items-center justify-between text-xs transition-colors ${
                  s.completed
                    ? "bg-ink-950/40 border-ink-800/40 opacity-60"
                    : "bg-ink-950/90 border-ink-800 hover:border-ink-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      s.completed ? "bg-academic-900 border-academic-600 text-academic-300" : "border-ink-600"
                    }`}
                  >
                    {s.completed && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-400">{s.time}</span>
                      <span className={`font-medium ${s.completed ? "line-through text-ink-400" : "text-ink-100"}`}>
                        {s.subject} · {s.topic}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-500 font-mono mt-0.5">
                      Duration: {s.duration} · Type: {s.type}
                    </p>
                  </div>
                </div>

                <Badge variant={s.type === "Revision" ? "warning" : s.type === "Practice" ? "outline" : "neutral"} className="text-[10px]">
                  {s.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
