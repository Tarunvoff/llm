"use client";

import React from "react";
import { Trophy, Zap, Flame, Award, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AchievementsPage() {
  const badges = [
    { title: "First Flawless Diagnostic", desc: "Scored 100% on a medium-difficulty practice set.", xp: "+100 XP", unlocked: true, bg: "bg-[#FFF9D6]", border: "border-[#FFF1A3]", text: "text-[#8F6E00]" },
    { title: "12-Day Consistency Master", desc: "Maintained a 12-day active study streak.", xp: "+150 XP", unlocked: true, bg: "bg-[#FFF3F0]", border: "border-[#FFC8BC]", text: "text-[#BD3012]" },
    { title: "Mistake Exterminator", desc: "Resolved 15 recurring mistakes via spaced retesting.", xp: "+200 XP", unlocked: true, bg: "bg-[#F0E9FD]", border: "border-[#E0D1FB]", text: "text-[#6C38D4]" },
    { title: "RAG Researcher", desc: "Referenced 50+ textbook citations during tutor dialogues.", xp: "+100 XP", unlocked: false, bg: "bg-[#FAF9F5]", border: "border-[#E8E6DE]", text: "text-[#707070]" },
    { title: "Master of Mechanics", desc: "Achieved >85% mastery in all Mechanics topics.", xp: "+300 XP", unlocked: false, bg: "bg-[#FAF9F5]", border: "border-[#E8E6DE]", text: "text-[#707070]" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Academic Badges & Mastery</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Celebration layer recognizing consistent study discipline, active recall, and rigorous problem-solving.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4 ${
                b.unlocked ? "bg-white" : "bg-[#FAF9F5] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${b.bg} ${b.border} ${b.text}`}
                >
                  {b.unlocked ? <Trophy className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </div>
                <Badge variant={b.unlocked ? "coral" : "neutral"} className="text-xs font-bold">
                  {b.xp}
                </Badge>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-[#151515]">{b.title}</h3>
                <p className="text-xs text-[#555555] mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
