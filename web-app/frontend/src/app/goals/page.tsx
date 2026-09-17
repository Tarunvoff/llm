"use client";

import React from "react";
import { Target, CheckCircle2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function GoalsPage() {
  const goals = [
    { title: "Target Score NEET 650+", target: "650 / 720", current: "612", progress: 85, dueDate: "May 2027", variant: "coral" },
    { title: "Resolve All Mechanics Mistakes", target: "100%", current: "75%", progress: 75, dueDate: "This Week", variant: "yellow" },
    { title: "Complete 500 Practice Problems", target: "500", current: "210", progress: 42, dueDate: "End of Month", variant: "lavender" },
    { title: "Maintain 14-Day Study Streak", target: "14 Days", current: "12 Days", progress: 85, dueDate: "Ongoing", variant: "academic" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Study Milestones & Goals</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Set and track quantifiable academic milestones aligned with your exam preparation roadmap.
            </p>
          </div>
          <Button variant="primary" size="sm" className="text-xs h-9 font-bold shadow-sm">
            + Set New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFE8]">
                <Badge variant={g.variant as any} className="text-xs font-bold">{g.dueDate}</Badge>
                <span className="font-display font-bold text-sm text-[#FF5734]">{g.progress}%</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#151515]">{g.title}</h3>
                <p className="text-xs text-[#555555] mt-1 font-medium">Current: <strong>{g.current}</strong> / Target: {g.target}</p>
              </div>
              <Progress value={g.progress} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
