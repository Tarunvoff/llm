"use client";

import React from "react";
import { User, Flame, Zap, CheckCircle2, BookOpen, Clock, Target, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = user?.profile;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Student Profile</h2>
            <p className="text-xs text-ink-400">
              Your academic identity, goal parameters, and calibrated learning settings.
            </p>
          </div>
        </div>

        {/* Profile Card Header */}
        <Card className="p-6 bg-ink-900/90 border-ink-800">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-academic-700 text-white flex items-center justify-center text-xl font-bold font-mono">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-ink-100">{user?.full_name || "Aarav Sharma"}</h3>
              <p className="text-xs text-ink-400">{user?.email || "student@intellitutor.ai"}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Badge variant="academic" className="text-[10px] font-mono uppercase">
                  {profile?.target_exam || "NEET"} Aspirant
                </Badge>
                <Badge variant="neutral" className="text-[10px] font-mono">
                  {profile?.current_grade_level || "Class 12 / Aspirant"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs">
              <Flame className="h-4 w-4 fill-amber-400/20" />
              <span className="font-mono uppercase text-[10px]">Study Streak</span>
            </div>
            <p className="text-xl font-bold font-mono text-ink-100">{profile?.streak_days || 7} Days</p>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-academic-400 text-xs">
              <Zap className="h-4 w-4" />
              <span className="font-mono uppercase text-[10px]">XP Accumulated</span>
            </div>
            <p className="text-xl font-bold font-mono text-ink-100">{profile?.xp || 580}</p>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-ink-300 text-xs">
              <Clock className="h-4 w-4" />
              <span className="font-mono uppercase text-[10px]">Total Study Time</span>
            </div>
            <p className="text-xl font-bold font-mono text-ink-100">{Math.round((profile?.total_study_minutes || 2450) / 60)} Hours</p>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-ink-300 text-xs">
              <CheckCircle2 className="h-4 w-4 text-academic-400" />
              <span className="font-mono uppercase text-[10px]">Questions Solved</span>
            </div>
            <p className="text-xl font-bold font-mono text-ink-100">{profile?.questions_solved || 210}</p>
          </Card>
        </div>

        {/* Configuration Summary */}
        <Card className="space-y-3">
          <CardHeader className="pb-3 border-b border-ink-800">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ink-300 font-mono">
              Calibrated Learning Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-ink-800/50">
              <span className="text-ink-400">Target Exam Timeline</span>
              <span className="text-ink-100 font-medium">{profile?.target_exam_date || "May 2027"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-ink-800/50">
              <span className="text-ink-400">Daily Study Target</span>
              <span className="text-ink-100 font-medium">{profile?.daily_study_hours || 3.5} Hours / Day</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-ink-800/50">
              <span className="text-ink-400">AI Explanation Preference</span>
              <span className="text-academic-400 font-medium">{profile?.explanation_preference || "Exam-oriented"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-ink-400">Focus Subjects</span>
              <span className="text-ink-100 font-medium">
                {(profile?.selected_subjects || ["Physics", "Chemistry", "Biology"]).join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
