"use client";

import React from "react";
import { RotateCcw, CheckCircle2, Clock, Calendar, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevisionPage() {
  const revisionBuckets = [
    {
      stage: "Stage 1 (Today)",
      desc: "Immediate active recall after 24h",
      count: 2,
      topics: [
        { subject: "Physics", topic: "Conservation of Angular Momentum", interval: "24h Interval" },
        { subject: "Biology", topic: "Cell Division (Mitosis vs Meiosis)", interval: "24h Interval" },
      ],
    },
    {
      stage: "Stage 2 (Tomorrow)",
      desc: "3-Day memory stabilization interval",
      count: 1,
      topics: [
        { subject: "Chemistry", topic: "Markovnikov Addition & Carbocations", interval: "3d Interval" },
      ],
    },
    {
      stage: "Stage 3 (In 7 Days)",
      desc: "Weekly consolidation interval",
      count: 3,
      topics: [
        { subject: "Physics", topic: "Work-Energy Theorem in Non-Conservative Fields", interval: "7d Interval" },
        { subject: "Biology", topic: "Enzyme Kinetics and Michaelis Constant", interval: "7d Interval" },
        { subject: "Chemistry", topic: "Thermodynamics & Enthalpy Calculation", interval: "7d Interval" },
      ],
    },
    {
      stage: "Stage 4 (In 30 Days)",
      desc: "Long-term permanent memory interval",
      count: 4,
      topics: [
        { subject: "Physics", topic: "Kinematics 2D Projectile Equations", interval: "30d Interval" },
        { subject: "Chemistry", topic: "Periodic Trends & Electronegativity", interval: "30d Interval" },
      ],
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Spaced Repetition Schedule</h2>
            <p className="text-xs text-ink-400">
              Ebbinghaus decay curve optimization. Review topics at expanding intervals to lock them into long-term memory.
            </p>
          </div>

          <Button variant="academic" size="sm" className="text-xs h-8">
            Start Today's Review (2)
          </Button>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revisionBuckets.map((bucket, idx) => (
            <Card key={idx} className="space-y-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ink-200 font-mono">
                    {bucket.stage}
                  </CardTitle>
                  <p className="text-[11px] text-ink-500">{bucket.desc}</p>
                </div>
                <Badge variant={bucket.stage.includes("Today") ? "warning" : "neutral"} className="text-[10px] font-mono">
                  {bucket.count} Topics
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {bucket.topics.map((t, tIdx) => (
                  <div key={tIdx} className="p-3 rounded-md bg-ink-950/80 border border-ink-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-ink-100">{t.topic}</p>
                      <p className="text-[10px] text-ink-500 font-mono">{t.subject} · {t.interval}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-ink-700">
                      Review →
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
