"use client";

import React from "react";
import { Trophy, Zap, Flame, Award, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AchievementsPage() {
  const badges = [
    { title: "First Flawless Diagnostic", desc: "Scored 100% on a medium-difficulty practice set.", xp: "+100 XP", unlocked: true },
    { title: "7-Day Consistency Master", desc: "Maintained a 7-day active study streak.", xp: "+150 XP", unlocked: true },
    { title: "Mistake Exterminator", desc: "Resolved 15 recurring mistakes via spaced retesting.", xp: "+200 XP", unlocked: true },
    { title: "RAG Researcher", desc: "Referenced 50+ textbook citations during tutor dialogues.", xp: "+100 XP", unlocked: false },
    { title: "Master of Mechanics", desc: "Achieved >85% mastery in all Mechanics topics.", xp: "+300 XP", unlocked: false },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Academic Badges & Mastery</h2>
            <p className="text-xs text-ink-400">
              Subtle motivation layer celebrating consistent study habits and rigorous problem solving.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b, idx) => (
            <Card
              key={idx}
              className={`space-y-3 ${
                b.unlocked
                  ? "border-academic-700/50 bg-ink-900/90"
                  : "border-ink-800/50 bg-ink-950/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    b.unlocked ? "bg-academic-900 text-academic-300" : "bg-ink-800 text-ink-500"
                  }`}
                >
                  {b.unlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <Badge variant={b.unlocked ? "academic" : "neutral"} className="text-[10px] font-mono">
                  {b.xp}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-100">{b.title}</h3>
                <p className="text-xs text-ink-400 mt-1">{b.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
