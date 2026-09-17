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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Mastery & Analytics</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Measuring genuine conceptual progression over time. No vanity metrics—just real retention data.
            </p>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFF3F0] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BD3012]">Overall Mastery</span>
            <p className="text-3xl font-display font-bold text-[#FF5734] mt-1">68.4%</p>
            <p className="text-xs text-[#166534] font-semibold mt-1">↑ +4.2% this week</p>
          </div>

          <div className="bg-[#F0E9FD] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C38D4]">Test Accuracy</span>
            <p className="text-3xl font-display font-bold text-[#6C38D4] mt-1">78.5%</p>
            <p className="text-xs text-[#555555] mt-1 font-medium">Across 142 questions</p>
          </div>

          <div className="bg-[#FFF9D6] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6E00]">Total Study Hours</span>
            <p className="text-3xl font-display font-bold text-[#8F6E00] mt-1">30.6h</p>
            <p className="text-xs text-[#555555] mt-1 font-medium">Target: 3.5h / day</p>
          </div>

          <div className="bg-[#F0FDF4] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Mistakes Resolved</span>
            <p className="text-3xl font-display font-bold text-[#166534] mt-1">18 / 24</p>
            <p className="text-xs text-[#166534] font-semibold mt-1">75% resolution rate</p>
          </div>
        </div>

        {/* Visual Topic Map Section */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEFE8]">
            <div>
              <h3 className="text-lg font-display font-bold text-[#151515]">
                Cognitive Mastery Map
              </h3>
              <p className="text-xs text-[#707070] mt-0.5">
                Bayesian Knowledge Tracing (BKT) scores per topic. Weak nodes trigger adaptive practice quizzes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {["Physics", "Chemistry", "Biology"].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedSubject === subj
                      ? "bg-[#151515] text-white shadow-sm"
                      : "bg-[#FAF9F5] text-[#555555] border border-[#E8E6DE] hover:text-[#151515] hover:bg-white"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {topicTree[selectedSubject].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-2.5 transition-all hover:bg-white hover:border-[#D2CFC2]"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#151515]">{item.topic}</span>
                    <Badge
                      variant={item.mastery < 60 ? "coral" : item.mastery < 75 ? "yellow" : "academic"}
                      className="text-[10px] font-bold"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <span className="font-display font-bold text-base text-[#151515]">{item.mastery}%</span>
                </div>
                <div className="h-2.5 w-full bg-[#EFEFE8] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.mastery < 60
                        ? "bg-[#FF5734]"
                        : item.mastery < 75
                        ? "bg-[#FFCC42]"
                        : "bg-[#16A34A]"
                    }`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
