"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, Plus, Sparkles, Check } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Study Planner</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Personalized roadmap automatically synchronized with your exam target and spaced repetition triggers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-xs h-9 font-bold border-[#E4E2D8]">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#FF5734]" />
              Re-optimize Plan
            </Button>
            <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
              + Add Session
            </Button>
          </div>
        </div>

        {/* Days Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {days.map((d, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                d.isToday
                  ? "bg-[#FFCC42] border-[#151515] text-[#151515] shadow-[4px_4px_0px_0px_#151515] font-bold"
                  : "bg-white border-[#E8E6DE] text-[#555555] hover:border-[#151515] hover:bg-[#FAF9F5]"
              }`}
            >
              <p className="text-sm font-display font-bold">{d.name}</p>
              <p className="text-xs mt-0.5 opacity-80">{d.date}</p>
              {d.isToday && (
                <span className="inline-block text-[10px] uppercase font-bold bg-[#151515] text-white px-2 py-0.5 rounded-full mt-2">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Schedule List */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFEFE8]">
            <h3 className="font-display font-bold text-base text-[#151515]">
              Monday Study Timeline (3.5h Planned)
            </h3>
            <span className="text-xs text-[#707070] font-semibold">5 sessions</span>
          </div>

          <div className="space-y-3">
            {planSessions.map((s, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  s.completed
                    ? "bg-[#FAF9F5] border-[#E8E6DE] opacity-60"
                    : "bg-white border-[#E8E6DE] hover:border-[#D2CFC2] shadow-subtle"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      s.completed ? "bg-[#16A34A] border-[#16A34A] text-white" : "border-[#D2CFC2] bg-white"
                    }`}
                  >
                    {s.completed && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-xs text-[#FF5734]">{s.time}</span>
                      <span className={`font-bold text-sm ${s.completed ? "line-through text-[#707070]" : "text-[#151515]"}`}>
                        {s.subject} • {s.topic}
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] mt-0.5 font-medium">
                      Duration: {s.duration} • Type: {s.type}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={s.type === "Revision" ? "yellow" : s.type === "Practice" ? "coral" : "lavender"}
                  className="text-xs font-bold"
                >
                  {s.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
