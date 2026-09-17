"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
  X,
  Target,
  Lightbulb,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/context/auth-context";
import { ApiClient, DashboardSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDrilldownTopic, setActiveDrilldownTopic] = useState<any | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await ApiClient.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    if (!data) return;
    // Optimistic UI update
    const updatedPlan = data.today_plan.map((item) => {
      if (item.id === taskId) {
        return { ...item, is_completed: !item.is_completed };
      }
      return item;
    });
    const completedCount = updatedPlan.filter((i) => i.is_completed).length;
    const progressPct = Math.round((completedCount / (updatedPlan.length || 1)) * 100);

    setData({
      ...data,
      today_plan: updatedPlan,
      today_progress_percentage: progressPct,
    });

    try {
      await ApiClient.toggleTask(taskId);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      fetchDashboard();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = user?.full_name?.split(" ")[0] || "Student";

  return (
    <AppShell>
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5734] bg-[#FFF3F0] px-2.5 py-0.5 rounded-full border border-[#FFC8BC]">
              STUDY WORKSPACE
            </span>
            <span className="text-xs text-[#707070]">
              Goal: <strong>{data?.target_exam || user?.profile?.target_exam || "NEET"} 2026</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515] tracking-tight">
            {getGreeting()}, {name}.
          </h2>
          <p className="text-xs sm:text-sm text-[#555555]">
            Here's what deserves your attention and focus today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/practice">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 font-bold border-[#E4E2D8]">
              <HelpCircle className="h-3.5 w-3.5 text-[#FF5734]" />
              <span>Diagnostic Test</span>
            </Button>
          </Link>
          <Link href="/tutor">
            <Button variant="primary" size="sm" className="text-xs h-9 gap-1.5 font-bold">
              <Bot className="h-3.5 w-3.5" />
              <span>Ask AI Coach</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Study Agenda & AI Recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Large Primary Study Card: TODAY'S FOCUS */}
          <div className="bg-[#FFF3F0] border-2 border-[#151515] rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#151515] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#BD3012] bg-white px-3 py-1 rounded-full border border-[#FFC8BC]">
                  TODAY'S FOCUS
                </span>
                <span className="text-xs font-semibold text-[#555555]">High-Yield Priority</span>
              </div>
              <Badge variant="coral" className="text-xs font-mono font-bold">
                20 min session
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#151515]">
                {data?.ai_recommendation?.highlight || "Physics: Rotational Motion (Angular Momentum)"}
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {data?.ai_recommendation?.description || "Review conservation of angular momentum and rolling without slipping before your next problem set."}
              </p>
            </div>

            {/* Mastery bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFC8BC] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#151515]">
                <span>Current Topic Mastery</span>
                <span className="text-[#FF5734]">42%</span>
              </div>
              <div className="h-2.5 w-full bg-[#FFE4DE] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5734] rounded-full" style={{ width: "42%" }} />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/tutor">
                <Button variant="primary" size="sm" className="text-xs h-9 px-4 font-bold">
                  {data?.ai_recommendation?.action_text || "Start Studying Now"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/mistakes">
                <Button variant="outline" size="sm" className="text-xs h-9 bg-white border-[#FFC8BC] text-[#BD3012] hover:bg-[#FFF3F0] font-bold">
                  Review 3 Mistakes on this Topic
                </Button>
              </Link>
            </div>
          </div>

          {/* Today's Study Plan Checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-display font-bold text-[#151515] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#FF5734]" />
                  Today's Action Plan
                </CardTitle>
                <CardDescription>
                  Click any checkbox to complete or reschedule your sessions.
                </CardDescription>
              </div>
              <Badge variant="yellow" className="text-xs font-bold">
                {data?.today_progress_percentage || 33}% Complete
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              {data?.today_plan && data.today_plan.length > 0 ? (
                data.today_plan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      item.is_completed
                        ? "bg-[#FAF9F5] border-[#E8E6DE] opacity-60"
                        : "bg-white border-[#E8E6DE] hover:border-[#D2CFC2] shadow-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(item.id)}
                        className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          item.is_completed
                            ? "bg-[#16A34A] border-[#16A34A] text-white"
                            : "border-[#D2CFC2] hover:border-[#FF5734] bg-white"
                        }`}
                        title={item.is_completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.is_completed && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${item.is_completed ? "line-through text-[#707070]" : "text-[#151515]"}`}>
                            {item.subject} • {item.topic}
                          </p>
                          <Badge
                            variant={
                              item.activity_type === "Practice"
                                ? "coral"
                                : item.activity_type === "Revision"
                                ? "yellow"
                                : "lavender"
                            }
                            className="text-[10px] py-0 px-2 font-semibold"
                          >
                            {item.activity_type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#707070] mt-0.5 font-medium">
                          {item.time} ({item.duration_min} min)
                        </p>
                      </div>
                    </div>

                    {!item.is_completed && (
                      <Link href={item.activity_type === "Practice" ? "/practice" : "/tutor"}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-[#E4E2D8] text-[#151515] hover:bg-[#FAF9F5]">
                          Start <Play className="h-3 w-3 ml-1 fill-[#151515]" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#707070]">
                  No sessions scheduled for today.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Needs Attention: Weak Topics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-display font-bold text-[#151515] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#FF5734]" />
                  Needs Attention
                </CardTitle>
                <CardDescription>
                  Topics with conceptual mastery below 65%. Click for diagnostic remediation.
                </CardDescription>
              </div>
              <Link href="/analytics" className="text-xs font-bold text-[#FF5734] hover:underline">
                Topic Map →
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {data?.weak_topics && data.weak_topics.map((wt, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveDrilldownTopic(wt)}
                  className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] hover:border-[#D2CFC2] hover:bg-white cursor-pointer transition-all space-y-2 shadow-subtle"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#707070] font-semibold text-[11px]">{wt.subject} • </span>
                      <span className="font-bold text-[#151515]">{wt.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                        {wt.mistake_count} errors
                      </span>
                      <span className="font-bold text-xs text-[#151515]">{wt.mastery_percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#EFEFE8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        wt.mastery_percentage < 45 ? "bg-[#FF5734]" : "bg-[#FFCC42]"
                      }`}
                      style={{ width: `${wt.mastery_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Stats & Spaced Repetition */}
        <div className="space-y-6">
          {/* Daily Progress & Motivation Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display font-bold text-[#151515]">
                Daily Study Momentum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FFF9D6] border border-[#FFF1A3] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8F6E00] text-xs">
                    <Flame className="h-4 w-4 fill-[#FFCC42] text-[#FFCC42]" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">Streak</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-[#151515]">
                    {data?.streak_days || 12} <span className="text-xs font-normal text-[#707070]">days</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F0E9FD] border border-[#E0D1FB] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#6C38D4] text-xs">
                    <Zap className="h-4 w-4 fill-[#B99AF5] text-[#B99AF5]" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">XP Earned</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-[#151515]">
                    {data?.xp || 580}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-[#555555]">
                  <span className="font-semibold">Diagnostic Accuracy</span>
                  <span className="font-bold text-[#151515]">{data?.accuracy_percentage || 82.4}%</span>
                </div>
                <Progress value={data?.accuracy_percentage || 82.4} />
              </div>

              <div className="flex items-center justify-between text-xs text-[#555555] pt-2 border-t border-[#EFEFE8]">
                <span>Questions Solved</span>
                <span className="font-bold text-[#151515]">{data?.questions_solved || 210}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revision Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-display font-bold text-[#151515] flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-[#B99AF5]" />
                  Revision Due
                </CardTitle>
                <CardDescription>
                  Active recall intervals to lock memory.
                </CardDescription>
              </div>
              <Link href="/revision" className="text-xs font-bold text-[#FF5734] hover:underline">
                All ({data?.revision_due?.length || 3}) →
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {data?.revision_due && data.revision_due.map((rev) => (
                <div key={rev.id} className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#151515]">{rev.topic}</p>
                    <p className="text-[10px] text-[#707070]">{rev.subject} • Stage {rev.interval_stage}</p>
                  </div>
                  <Badge
                    variant={rev.due_text === "Due Today" ? "coral" : "neutral"}
                    className="text-[10px] font-bold"
                  >
                    {rev.due_text}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Upload Library Widget */}
          <Card className="bg-[#FAF9F5] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515]">
            <CardContent className="pt-0 p-5 space-y-3 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF3F0] text-[#FF5734] mx-auto border border-[#FFC8BC]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-display font-bold text-[#151515]">Upload Textbooks & Notes</p>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Index PDFs to enable note-grounded AI explanations with exact page citations.
                </p>
              </div>
              <Link href="/library">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 font-bold border-[#151515]">
                  Open Study Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topic Drilldown Modal */}
      {activeDrilldownTopic && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#151515] rounded-3xl shadow-[8px_8px_0px_0px_#151515] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-4">
              <div>
                <Badge variant="coral" className="text-[10px] font-bold uppercase">
                  {activeDrilldownTopic.subject}
                </Badge>
                <h3 className="text-lg font-display font-bold text-[#151515] mt-1">
                  {activeDrilldownTopic.topic}
                </h3>
              </div>
              <button
                onClick={() => setActiveDrilldownTopic(null)}
                className="text-[#707070] hover:text-[#151515] p-1.5 rounded-full hover:bg-[#FAF9F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#555555] font-semibold">Current BKT Mastery:</span>
                <span className="font-bold text-[#FF5734] text-sm">{activeDrilldownTopic.mastery_percentage}%</span>
              </div>
              <Progress value={activeDrilldownTopic.mastery_percentage} />
              <p className="text-[#555555] leading-relaxed bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E6DE]">
                You have recorded <strong>{activeDrilldownTopic.mistake_count} recent errors</strong> on this topic. We recommend reviewing the foundational derivations and attempting a targeted diagnostic quiz.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDrilldownTopic(null)}
                className="text-xs h-9 font-bold border-[#E4E2D8]"
              >
                Close
              </Button>
              <Link href="/tutor">
                <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
                  Ask AI Tutor →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
