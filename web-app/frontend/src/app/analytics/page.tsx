"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AnalyticsPage() {
  const [selectedSubject, setSelectedSubject] = useState("Physics");

  const topicTree: Record<string, Array<{ topic: string; mastery: number; status: string }>> = {
    Physics: [
      { topic: "Kinematics & 2D Projectile Motion", mastery: 82, status: "Mastered" },
      { topic: "Newton's Laws of Motion & Friction", mastery: 74, status: "Proficient" },
      { topic: "Work, Energy & Power", mastery: 61, status: "Progressing" },
      { topic: "Rotational Motion & Angular Momentum", mastery: 42, status: "Needs Review" },
      { topic: "Electrostatics & Gauss's Law", mastery: 79, status: "Proficient" },
    ],
    Chemistry: [
      { topic: "Electrophilic Addition Reactions", mastery: 48, status: "Needs Review" },
      { topic: "Thermodynamics & Enthalpy", mastery: 68, status: "Proficient" },
      { topic: "Chemical Equilibrium & Le Chatelier", mastery: 77, status: "Proficient" },
      { topic: "Periodic Classification & Radii", mastery: 88, status: "Mastered" },
    ],
    Biology: [
      { topic: "Cell Division (Mitosis & Meiosis)", mastery: 51, status: "Needs Review" },
      { topic: "Mendelian Genetics & Inheritance", mastery: 84, status: "Mastered" },
      { topic: "Photosynthesis & Light Reactions", mastery: 71, status: "Proficient" },
      { topic: "Human Circulatory System", mastery: 90, status: "Mastered" },
    ],
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Mastery & Learning Analytics</h2>
            <p className="text-xs text-ink-400">
              Measuring genuine cognitive progression. "Am I actually retaining and improving?"
            </p>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold">Overall Mastery</span>
            <p className="text-2xl font-bold font-mono text-academic-400 mt-1">68.4%</p>
            <p className="text-[11px] text-academic-500 mt-1">↑ +4.2% this week</p>
          </Card>

          <Card className="p-4">
            <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold">Test Accuracy</span>
            <p className="text-2xl font-bold font-mono text-ink-100 mt-1">78.5%</p>
            <p className="text-[11px] text-ink-400 mt-1">Across 142 questions</p>
          </Card>

          <Card className="p-4">
            <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold">Total Study Hours</span>
            <p className="text-2xl font-bold font-mono text-ink-100 mt-1">30.6h</p>
            <p className="text-[11px] text-ink-400 mt-1">Target: 3.5h / day</p>
          </Card>

          <Card className="p-4">
            <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold">Mistakes Resolved</span>
            <p className="text-2xl font-bold font-mono text-ink-100 mt-1">18 / 24</p>
            <p className="text-[11px] text-academic-400 mt-1">75% resolution rate</p>
          </Card>
        </div>

        {/* Visual Topic Map Section */}
        <Card className="space-y-4">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ink-800">
            <div>
              <CardTitle className="text-sm font-semibold text-ink-100">
                Cognitive Mastery Map
              </CardTitle>
              <CardDescription>
                Bayesian Knowledge Tracing (BKT) scores per topic. Weak nodes require targeted retesting.
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              {["Physics", "Chemistry", "Biology"].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedSubject === subj
                      ? "bg-ink-800 text-white border border-ink-700 font-semibold"
                      : "text-ink-400 hover:text-ink-200"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {topicTree[selectedSubject].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-md bg-ink-950/80 border border-ink-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-100">{item.topic}</span>
                    <Badge
                      variant={item.mastery < 60 ? "danger" : item.mastery < 75 ? "warning" : "academic"}
                      className="text-[9px] font-mono py-0 px-1"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <span className="font-mono font-bold text-xs text-ink-200">{item.mastery}%</span>
                </div>
                <Progress
                  value={item.mastery}
                  colorClass={item.mastery < 60 ? "bg-red-500" : item.mastery < 75 ? "bg-amber-500" : "bg-academic-500"}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
