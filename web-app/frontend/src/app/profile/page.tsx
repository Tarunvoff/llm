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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Student Profile</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Your personal study coach settings, target milestones, and pedagogical preferences.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs h-9 gap-1.5 font-bold shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile Preferences</span>
          </Button>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515]">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-[#FFCC42] border-2 border-[#151515] flex items-center justify-center font-display font-bold text-2xl text-[#151515] shrink-0">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-display font-bold text-[#151515]">{user?.full_name || "Aarav Sharma"}</h3>
              <p className="text-xs text-[#707070]">{user?.email || "student@intellitutor.ai"}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                <Badge variant="coral" className="text-xs font-bold uppercase">
                  {profile?.target_exam || "NEET"} Aspirant
                </Badge>
                <Badge variant="yellow" className="text-xs font-bold">
                  {profile?.current_grade_level || "Class 12 / Aspirant"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#FFF9D6] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <div className="flex items-center gap-1.5 text-[#8F6E00] text-xs">
              <Flame className="h-4 w-4 fill-[#FFCC42] text-[#FFCC42]" />
              <span className="font-bold uppercase text-[10px]">Study Streak</span>
            </div>
            <p className="text-2xl font-display font-bold text-[#151515]">{profile?.streak_days || 12} Days</p>
          </div>

          <div className="bg-[#F0E9FD] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <div className="flex items-center gap-1.5 text-[#6C38D4] text-xs">
              <Zap className="h-4 w-4 fill-[#B99AF5] text-[#B99AF5]" />
              <span className="font-bold uppercase text-[10px]">XP Earned</span>
            </div>
            <p className="text-2xl font-display font-bold text-[#151515]">{profile?.xp || 580}</p>
          </div>

          <div className="bg-[#FFF3F0] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <div className="flex items-center gap-1.5 text-[#BD3012] text-xs">
              <Clock className="h-4 w-4" />
              <span className="font-bold uppercase text-[10px]">Study Time</span>
            </div>
            <p className="text-2xl font-display font-bold text-[#151515]">{Math.round((profile?.total_study_minutes || 2450) / 60)} Hours</p>
          </div>

          <div className="bg-[#F0FDF4] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <div className="flex items-center gap-1.5 text-[#166534] text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-bold uppercase text-[10px]">Questions Solved</span>
            </div>
            <p className="text-2xl font-display font-bold text-[#151515]">{profile?.questions_solved || 210}</p>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-4">
          <div className="pb-3 border-b border-[#EFEFE8]">
            <h3 className="font-display font-bold text-base text-[#151515]">
              Calibrated Learning Parameters
            </h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-2 border-b border-[#EFEFE8]">
              <span className="text-[#707070]">Target Exam Timeline</span>
              <span className="text-[#151515] font-bold">{profile?.target_exam_date || "May 2027"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#EFEFE8]">
              <span className="text-[#707070]">Daily Study Target</span>
              <span className="text-[#151515] font-bold">{profile?.daily_study_hours || 3.5} Hours / Day</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#EFEFE8]">
              <span className="text-[#707070]">AI Explanation Preference</span>
              <span className="text-[#FF5734] font-bold">{profile?.explanation_preference || "Exam-oriented"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#707070]">Focus Subjects</span>
              <span className="text-[#151515] font-bold">
                {(profile?.selected_subjects || ["Physics", "Chemistry", "Biology"]).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Preferences Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#151515] rounded-3xl shadow-[8px_8px_0px_0px_#151515] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-4">
              <h3 className="text-lg font-display font-bold text-[#151515]">
                Edit Learning Parameters
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[#707070] hover:text-[#151515] p-1.5 rounded-full hover:bg-[#FAF9F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-[#151515]">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#151515]">Target Exam</label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E4E2D8] rounded-xl px-3 text-xs sm:text-sm font-semibold text-[#151515] focus:outline-none focus:border-[#FF5734]"
                >
                  <option value="NEET">NEET (Medical)</option>
                  <option value="JEE">JEE (Engineering)</option>
                  <option value="UPSC">UPSC Civil Services</option>
                  <option value="GATE">GATE</option>
                  <option value="CAT">CAT</option>
                  <option value="University">University STEM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#151515]">Target Exam Timeline</label>
                <Input
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  placeholder="e.g. May 2027"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-[#151515]">
                  <label>Daily Study Target</label>
                  <span className="text-[#FF5734]">{dailyHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5734]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#151515]">AI Explanation Preference</label>
                <select
                  value={explanationPref}
                  onChange={(e) => setExplanationPref(e.target.value)}
                  className="w-full h-10 bg-white border border-[#E4E2D8] rounded-xl px-3 text-xs sm:text-sm font-semibold text-[#151515] focus:outline-none focus:border-[#FF5734]"
                >
                  <option value="Exam-oriented">Exam-oriented</option>
                  <option value="Intermediate">Structured & Balanced</option>
                  <option value="Beginner">Beginner Friendly</option>
                  <option value="Child">Explain Like I'm 10</option>
                  <option value="Expert">Rigorous & Advanced</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E8E6DE]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-9 text-xs font-bold border-[#E4E2D8]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  className="h-9 text-xs font-bold"
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
