"use client";

import React from "react";
import { RotateCcw, CheckCircle2, Clock, Calendar, ArrowRight, Sparkles } from "lucide-react";
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
      variant: "coral",
      topics: [
        { subject: "Physics", topic: "Conservation of Angular Momentum", interval: "24h Interval" },
        { subject: "Biology", topic: "Cell Division (Mitosis vs Meiosis)", interval: "24h Interval" },
      ],
    },
    {
      stage: "Stage 2 (Tomorrow)",
      desc: "3-Day memory stabilization interval",
      count: 1,
      variant: "yellow",
      topics: [
        { subject: "Chemistry", topic: "Markovnikov Addition & Carbocations", interval: "3d Interval" },
      ],
    },
    {
      stage: "Stage 3 (In 7 Days)",
      desc: "Weekly consolidation interval",
      count: 3,
      variant: "lavender",
      topics: [
        { subject: "Physics", topic: "Work-Energy Theorem in Non-Conservative Fields", interval: "7d Interval" },
        { subject: "Biology", topic: "Enzyme Kinetics & Michaelis Constant", interval: "7d Interval" },
        { subject: "Chemistry", topic: "Thermodynamics & Enthalpy Calculation", interval: "7d Interval" },
      ],
    },
    {
      stage: "Stage 4 (In 30 Days)",
      desc: "Long-term permanent memory lock",
      count: 2,
      variant: "academic",
      topics: [
        { subject: "Physics", topic: "Kinematics 2D Projectile Equations", interval: "30d Interval" },
        { subject: "Chemistry", topic: "Periodic Trends & Electronegativity", interval: "30d Interval" },
      ],
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Spaced Repetition</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Ebbinghaus forgetting-curve prevention. Review topics at expanding intervals to lock concepts into permanent memory.
            </p>
          </div>

          <Button variant="primary" size="sm" className="text-xs h-9 font-bold shadow-sm">
            Start Today's Review (2)
          </Button>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revisionBuckets.map((bucket, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#151515] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
                <div>
                  <h3 className="font-display font-bold text-base text-[#151515]">
                    {bucket.stage}
                  </h3>
                  <p className="text-xs text-[#707070] mt-0.5">{bucket.desc}</p>
                </div>
                <Badge
                  variant={bucket.stage.includes("Today") ? "coral" : bucket.stage.includes("Tomorrow") ? "yellow" : "lavender"}
                  className="text-xs font-bold"
                >
                  {bucket.count} Topics
                </Badge>
              </div>

              <div className="space-y-3">
                {bucket.topics.map((t, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] flex items-center justify-between text-xs transition-all hover:bg-white hover:border-[#D2CFC2]"
                  >
                    <div>
                      <p className="font-bold text-[#151515]">{t.topic}</p>
                      <p className="text-[11px] text-[#707070] mt-0.5 font-medium">{t.subject} • {t.interval}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-[#E4E2D8] text-[#151515] hover:bg-[#FAF9F5]">
                      Review →
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
