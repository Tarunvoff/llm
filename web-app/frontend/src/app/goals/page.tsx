"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  X,
  AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApiClient } from "@/lib/api";

interface GoalItem {
  id: string | number;
  title: string;
  target_metric: string;
  current_metric: string;
  progress_percentage: number;
  due_date_str: string;
  variant: "coral" | "yellow" | "lavender" | "academic";
  is_completed: boolean;
  created_at?: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New goal form state
  const [title, setTitle] = useState("");
  const [targetMetric, setTargetMetric] = useState("");
  const [currentMetric, setCurrentMetric] = useState("");
  const [dueDateStr, setDueDateStr] = useState("End of Month");
  const [variant, setVariant] = useState<"coral" | "yellow" | "lavender" | "academic">("coral");

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.getGoals();
      const list = Array.isArray(data) ? data : (data?.goals || []);
      setGoals(list);
    } catch (err: any) {
      console.error("Failed to fetch goals:", err);
      setError("Unable to load study goals. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleToggle = async (id: string | number) => {
    try {
      const res = await ApiClient.toggleGoal(String(id));
      const updated = res?.goal || res;
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
    } catch (err: any) {
      console.error("Failed to toggle goal:", err);
    }
  };

  const handleDelete = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this study goal?")) return;
    try {
      await ApiClient.deleteGoal(String(id));
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetMetric.trim()) return;

    try {
      setSubmitting(true);
      const res = await ApiClient.createGoal({
        title: title.trim(),
        target_metric: targetMetric.trim(),
        current_metric: currentMetric.trim() || "0",
        due_date_str: dueDateStr.trim() || "Ongoing",
        variant: variant
      });
      const newGoal = res?.goal || res;
      setGoals(prev => [newGoal, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setTitle("");
      setTargetMetric("");
      setCurrentMetric("");
      setDueDateStr("End of Month");
      setVariant("coral");
    } catch (err: any) {
      console.error("Failed to create goal:", err);
      alert("Failed to create goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = goals.filter(g => g.is_completed).length;
  const overallProgress = goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress_percentage, 0) / goals.length) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515] flex items-center gap-2">
              <Target className="h-7 w-7 text-[#FF5734]" />
              Study Milestones & Goals
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Set and track quantifiable academic milestones aligned with your exam preparation roadmap.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="text-xs h-9 font-bold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Set New Goal
          </Button>
        </div>

        {/* Milestone Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-[#151515] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#151515]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#707070]">Active Goals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display font-bold text-[#151515]">{goals.length}</span>
              <span className="text-xs text-[#707070]">targets in progress</span>
            </div>
          </div>
          <div className="bg-[#FFF9D6] border-2 border-[#151515] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#151515]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F6E00]">Completed Milestones</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display font-bold text-[#151515]">{completedCount}</span>
              <span className="text-xs text-[#8F6E00]">targets achieved</span>
            </div>
          </div>
          <div className="bg-[#F0E9FD] border-2 border-[#151515] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#151515]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C38D4]">Aggregate Completion</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display font-bold text-[#6C38D4]">{overallProgress}%</span>
              <span className="text-xs text-[#6C38D4]">overall pacing</span>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center text-sm text-[#707070] font-medium">
            Loading your study goals and milestones...
          </div>
        )}

        {error && (
          <div className="bg-[#FFF3F0] border-2 border-[#FF5734] rounded-2xl p-4 text-[#BD3012] flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && goals.length === 0 && !error && (
          <div className="text-center py-16 bg-white border-2 border-dashed border-[#CCCCCC] rounded-3xl p-8 space-y-4">
            <Target className="h-12 w-12 text-[#999999] mx-auto" />
            <h3 className="font-display font-bold text-lg text-[#151515]">No Study Goals Set Yet</h3>
            <p className="text-xs sm:text-sm text-[#707070] max-w-md mx-auto">
              Define target test scores, weekly problem count quotas, or concept mastery targets to focus your tutoring sessions.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              + Create Your First Goal
            </Button>
          </div>
        )}

        {/* Goals Grid */}
        {!loading && goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((g) => (
              <div
                key={g.id}
                onClick={() => handleToggle(g.id)}
                className={`bg-white border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#151515] ${
                  g.is_completed ? "bg-[#FAF9F5] opacity-80" : ""
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EFEFE8]">
                  <div className="flex items-center gap-2">
                    <Badge variant={g.variant} className="text-xs font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {g.due_date_str}
                    </Badge>
                    {g.is_completed && (
                      <Badge variant="academic" className="text-xs font-bold bg-[#E8F8F0] text-[#1E7E34] border-[#A3E2B8]">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm text-[#FF5734]">
                      {g.progress_percentage}%
                    </span>
                    <button
                      onClick={(e) => handleDelete(g.id, e)}
                      title="Delete Goal"
                      className="text-[#999999] hover:text-[#BD3012] transition-colors p-1 rounded-md hover:bg-[#FFF3F0]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className={`font-display font-bold text-base text-[#151515] ${g.is_completed ? "line-through text-[#707070]" : ""}`}>
                    {g.title}
                  </h3>
                  <p className="text-xs text-[#555555] mt-1 font-medium">
                    Current: <strong>{g.current_metric}</strong> / Target: {g.target_metric}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Progress value={g.progress_percentage} />
                  <p className="text-[10px] text-[#707070] text-right font-medium">
                    {g.is_completed ? "Click card to mark in-progress" : "Click card to mark completed"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Goal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#151515]/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#151515] space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
                <h3 className="font-display font-bold text-lg text-[#151515] flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#FF5734]" />
                  Set New Academic Goal
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-[#707070] hover:text-[#151515] hover:bg-[#EFEFE8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#707070]">Goal Title</label>
                  <Input
                    required
                    placeholder="e.g. Master Thermodynamics, Score 680+ NEET"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[#707070]">Current Level</label>
                    <Input
                      placeholder="e.g. 520 / 720, 45%"
                      value={currentMetric}
                      onChange={(e) => setCurrentMetric(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[#707070]">Target Metric</label>
                    <Input
                      required
                      placeholder="e.g. 680 / 720, 100%"
                      value={targetMetric}
                      onChange={(e) => setTargetMetric(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[#707070]">Target Timeline</label>
                    <Input
                      placeholder="e.g. End of Month, May 2027"
                      value={dueDateStr}
                      onChange={(e) => setDueDateStr(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[#707070]">Card Theme</label>
                    <select
                      value={variant}
                      onChange={(e) => setVariant(e.target.value as any)}
                      className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border-2 border-[#151515] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5734]"
                    >
                      <option value="coral">Coral (High Priority)</option>
                      <option value="yellow">Yellow (Review)</option>
                      <option value="lavender">Lavender (Long-term)</option>
                      <option value="academic">Academic Emerald</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#EFEFE8]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Goal"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
