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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ink-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-ink-50 tracking-tight">
            {getGreeting()}, {name}.
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            Here's what matters today for your <strong className="text-ink-200">{data?.target_exam || user?.profile?.target_exam || "NEET"}</strong> preparation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/practice">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-ink-700">
              <HelpCircle className="h-3.5 w-3.5 text-academic-400" />
              <span>Diagnostic Test</span>
            </Button>
          </Link>
          <Link href="/tutor">
            <Button variant="academic" size="sm" className="text-xs h-8 gap-1.5 font-medium">
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
          {/* AI Targeted Recommendation Card */}
          <div className="p-4 rounded-lg bg-academic-950/50 border border-academic-700/60 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-academic-300">
                <Sparkles className="h-4 w-4 text-academic-400" />
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  AI Coach Priority
                </span>
              </div>
              <Badge variant="academic" className="text-[10px] font-mono">Real-time BKT</Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-ink-100">
                {data?.ai_recommendation?.highlight || "You've made the same conceptual mistake in Rotational Motion three times."}
              </h3>
              <p className="text-xs text-ink-300 leading-relaxed">
                {data?.ai_recommendation?.description || "Review angular momentum for 20 minutes before attempting another problem set."}
              </p>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <Link href="/tutor">
                <Button variant="academic" size="sm" className="text-xs h-7 px-3 font-medium">
                  {data?.ai_recommendation?.action_text || "Review Rotational Motion (20 min)"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
              <Link href="/mistakes">
                <Button variant="ghost" size="sm" className="text-xs h-7 text-ink-400 hover:text-ink-200">
                  View Mistake Breakdown
                </Button>
              </Link>
            </div>
          </div>

          {/* Today's Study Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-ink-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-academic-400" />
                  Today's Study Plan
                </CardTitle>
                <CardDescription>
                  Click any checkbox to complete or reschedule your sessions.
                </CardDescription>
              </div>
              <Badge variant="neutral" className="text-[11px] font-mono">
                {data?.today_progress_percentage || 33}% Complete
              </Badge>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {data?.today_plan && data.today_plan.length > 0 ? (
                data.today_plan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-md border flex items-center justify-between transition-colors ${
                      item.is_completed
                        ? "bg-ink-950/40 border-ink-800/50 opacity-70"
                        : "bg-ink-950/90 border-ink-800 hover:border-ink-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(item.id)}
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          item.is_completed
                            ? "bg-academic-900 border-academic-600 text-academic-300"
                            : "border-ink-600 hover:border-academic-500"
                        }`}
                        title={item.is_completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.is_completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-medium ${item.is_completed ? "line-through text-ink-400" : "text-ink-100"}`}>
                            {item.subject} · {item.topic}
                          </p>
                          <Badge
                            variant={
                              item.activity_type === "Practice"
                                ? "outline"
                                : item.activity_type === "Revision"
                                ? "warning"
                                : "neutral"
                            }
                            className="text-[9px] py-0 px-1"
                          >
                            {item.activity_type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                          {item.time} ({item.duration_min} min)
                        </p>
                      </div>
                    </div>

                    {!item.is_completed && (
                      <Link href={item.activity_type === "Practice" ? "/practice" : "/tutor"}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-academic-400 hover:text-academic-300">
                          Start <Play className="h-3 w-3 ml-1 fill-current" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-ink-500">
                  No sessions scheduled for today.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Needs Attention: Weak Topics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-ink-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Needs Attention
                </CardTitle>
                <CardDescription>
                  Topics with cognitive mastery below 65%. Click any topic for diagnostic remediation.
                </CardDescription>
              </div>
              <Link href="/analytics" className="text-xs text-academic-400 hover:underline font-mono">
                Topic Map →
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {data?.weak_topics && data.weak_topics.map((wt, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveDrilldownTopic(wt)}
                  className="p-3 rounded-md bg-ink-950/80 border border-ink-800 hover:border-ink-700 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-ink-400 font-mono text-[10px]">{wt.subject} · </span>
                      <span className="font-semibold text-ink-100">{wt.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-400 font-mono">{wt.mistake_count} errors</span>
                      <span className="font-mono font-bold text-xs text-amber-400">{wt.mastery_percentage}%</span>
                    </div>
                  </div>
                  <Progress
                    value={wt.mastery_percentage}
                    colorClass={wt.mastery_percentage < 45 ? "bg-red-500" : "bg-amber-500"}
                  />
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
              <CardTitle className="text-sm font-semibold text-ink-100">
                Daily Study Momentum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-ink-950/80 border border-ink-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                    <Flame className="h-4 w-4 fill-amber-400/20" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Streak</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-ink-100">
                    {data?.streak_days || 7} <span className="text-xs font-normal text-ink-400">days</span>
                  </p>
                </div>

                <div className="p-3 rounded-md bg-ink-950/80 border border-ink-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-academic-400 text-xs">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">XP Earned</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-ink-100">
                    {data?.xp || 580}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>Test Accuracy</span>
                  <span className="font-mono text-ink-200">{data?.accuracy_percentage || 82.4}%</span>
                </div>
                <Progress value={data?.accuracy_percentage || 82.4} />
              </div>

              <div className="flex items-center justify-between text-xs text-ink-400 pt-1 border-t border-ink-800/60">
                <span>Questions Solved</span>
                <span className="font-mono font-semibold text-ink-200">{data?.questions_solved || 210}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revision Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-ink-100 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-academic-400" />
                  Revision Due
                </CardTitle>
                <CardDescription>
                  Active recall intervals to prevent memory decay.
                </CardDescription>
              </div>
              <Link href="/revision" className="text-xs text-academic-400 hover:underline font-mono">
                All ({data?.revision_due?.length || 3}) →
              </Link>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {data?.revision_due && data.revision_due.map((rev) => (
                <div key={rev.id} className="p-2.5 rounded-md bg-ink-950/80 border border-ink-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-ink-200">{rev.topic}</p>
                    <p className="text-[10px] text-ink-500 font-mono">{rev.subject} · Stage {rev.interval_stage}</p>
                  </div>
                  <Badge
                    variant={rev.due_text === "Due Today" ? "warning" : "neutral"}
                    className="text-[10px] font-mono"
                  >
                    {rev.due_text}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Upload Library Widget */}
          <Card className="bg-ink-900/40 border-dashed border-ink-700">
            <CardContent className="pt-0 p-4 space-y-3 text-center">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-academic-400 mx-auto">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-ink-200">Upload Textbooks & Notes</p>
                <p className="text-[11px] text-ink-400 leading-normal">
                  Index PDFs to enable document-grounded AI explanations with exact page citations.
                </p>
              </div>
              <Link href="/library">
                <Button variant="outline" size="sm" className="w-full text-xs h-7 border-ink-700">
                  Open Study Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topic Drilldown Modal */}
      {activeDrilldownTopic && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-ink-900 border border-ink-800 rounded-lg shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div>
                <Badge variant="academic" className="text-[10px] font-mono uppercase">
                  {activeDrilldownTopic.subject}
                </Badge>
                <h3 className="text-base font-semibold text-ink-100 mt-1">
                  {activeDrilldownTopic.topic}
                </h3>
              </div>
              <button
                onClick={() => setActiveDrilldownTopic(null)}
                className="text-ink-400 hover:text-ink-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Current BKT Mastery:</span>
                <span className="font-mono text-academic-400 font-bold">{activeDrilldownTopic.mastery_percentage}%</span>
              </div>
              <Progress value={activeDrilldownTopic.mastery_percentage} />
              <p className="text-ink-300 leading-relaxed">
                You have recorded {activeDrilldownTopic.mistake_count} recent errors on this topic. We recommend reviewing the foundational derivations and attempting a targeted 3-question diagnostic quiz.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDrilldownTopic(null)}
                className="text-xs h-8 border-ink-700"
              >
                Close
              </Button>
              <Link href="/tutor">
                <Button variant="academic" size="sm" className="text-xs h-8">
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
