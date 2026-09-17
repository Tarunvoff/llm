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
    { title: "Target Score NEET 650+", target: "650 / 720", current: "612", progress: 85, dueDate: "May 2027" },
    { title: "Resolve All Mechanics Mistakes", target: "100%", current: "75%", progress: 75, dueDate: "This Week" },
    { title: "Complete 500 Practice Problems", target: "500", current: "210", progress: 42, dueDate: "End of Month" },
    { title: "Maintain 14-Day Study Streak", target: "14 Days", current: "7 Days", progress: 50, dueDate: "Ongoing" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Study Milestones & Goals</h2>
            <p className="text-xs text-ink-400">
              Set and track quantifiable academic milestones aligned with your exam timeline.
            </p>
          </div>
          <Button variant="academic" size="sm" className="text-xs h-8">
            + Set New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="academic" className="text-[10px] font-mono">{g.dueDate}</Badge>
                <span className="font-mono text-xs text-academic-400 font-bold">{g.progress}%</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-100">{g.title}</h3>
                <p className="text-xs text-ink-400 mt-1">Current: <strong>{g.current}</strong> / Target: {g.target}</p>
              </div>
              <Progress value={g.progress} />
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
