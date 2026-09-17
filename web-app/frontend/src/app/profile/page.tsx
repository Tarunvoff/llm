"use client";

import React, { useState } from "react";
import { User, Flame, Zap, CheckCircle2, BookOpen, Clock, Target, Calendar, Edit3, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClient } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "Aarav Sharma");
  const [targetExam, setTargetExam] = useState(profile?.target_exam || "NEET");
  const [targetExamDate, setTargetExamDate] = useState(profile?.target_exam_date || "May 2027");
  const [dailyHours, setDailyHours] = useState(profile?.daily_study_hours || 3.5);
  const [explanationPref, setExplanationPref] = useState(profile?.explanation_preference || "Exam-oriented");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await ApiClient.updateProfile({
        full_name: fullName,
        target_exam: targetExam,
        target_exam_date: targetExamDate,
        daily_study_hours: dailyHours,
        explanation_preference: explanationPref,
      });
      await refreshUser();
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs h-8 gap-1.5 border-ink-700"
          >
            <Edit3 className="h-3.5 w-3.5 text-academic-400" />
            <span>Edit Profile Preferences</span>
          </Button>
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

      {/* Edit Profile Preferences Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-ink-900 border border-ink-800 rounded-lg shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <h3 className="text-base font-semibold text-ink-100">
                Edit Learning Parameters
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-ink-400 hover:text-ink-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-ink-300">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ink-300">Target Exam</label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full h-9 bg-ink-950 border border-ink-700 rounded-md px-3 text-xs text-ink-100 focus:outline-none focus:border-academic-500 font-mono"
                >
                  <option value="NEET">NEET (Medical)</option>
                  <option value="JEE">JEE (Engineering)</option>
                  <option value="UPSC">UPSC Civil Services</option>
                  <option value="GATE">GATE</option>
                  <option value="CAT">CAT</option>
                  <option value="University">University STEM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ink-300">Target Exam Timeline</label>
                <Input
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  placeholder="e.g. May 2027"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-medium text-ink-300">Daily Study Target</label>
                  <span className="font-mono text-academic-400">{dailyHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-academic-500 bg-ink-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ink-300">AI Explanation Preference</label>
                <select
                  value={explanationPref}
                  onChange={(e) => setExplanationPref(e.target.value)}
                  className="w-full h-9 bg-ink-950 border border-ink-700 rounded-md px-3 text-xs text-ink-100 focus:outline-none focus:border-academic-500 font-mono"
                >
                  <option value="Exam-oriented">Exam-oriented</option>
                  <option value="Intermediate">Structured & Balanced</option>
                  <option value="Beginner">Beginner Friendly</option>
                  <option value="Child">Explain Like I'm 10</option>
                  <option value="Expert">Rigorous & Advanced</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-8 text-xs border-ink-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="academic"
                  size="sm"
                  isLoading={isSaving}
                  className="h-8 text-xs font-medium"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
