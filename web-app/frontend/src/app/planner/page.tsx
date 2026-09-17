"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight, Plus, Sparkles, Check, X, BookOpen, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

interface StudyDay {
  name: string;
  date: string;
  isToday: boolean;
}

interface PlanSession {
  id: string;
  day: string;
  time: string;
  subject: string;
  topic: string;
  duration: string;
  type: string;
  completed: boolean;
}

export default function PlannerPage() {
  const [days, setDays] = useState<StudyDay[]>([
    { name: "Monday", date: "Sep 22", isToday: true },
    { name: "Tuesday", date: "Sep 23", isToday: false },
    { name: "Wednesday", date: "Sep 24", isToday: false },
    { name: "Thursday", date: "Sep 25", isToday: false },
    { name: "Friday", date: "Sep 26", isToday: false },
  ]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [daysLeft, setDaysLeft] = useState(45);
  const [planTitle, setPlanTitle] = useState("NEET 45-Day High-Yield Adaptive Study Plan");
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Add Session Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState("Physics");
  const [newTopic, setNewTopic] = useState("");
  const [newTime, setNewTime] = useState("14:00");
  const [newDuration, setNewDuration] = useState(45);
  const [newType, setNewType] = useState("Study");

  const fetchPlan = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getWeeklyPlan();
      if (data) {
        if (data.days) setDays(data.days);
        if (data.sessions) setSessions(data.sessions);
        if (data.days_left) setDaysLeft(data.days_left);
        if (data.plan_title) setPlanTitle(data.plan_title);
      }
    } catch (err) {
      console.warn("Using fallback plan data:", err);
      setSessions([
        { id: "s1", day: "Monday", time: "08:00", subject: "Biology", topic: "Cell Division (Mitosis & Meiosis)", duration: "45 min", type: "Study", completed: true },
        { id: "s2", day: "Monday", time: "10:30", subject: "Physics", topic: "Kinematics Practice Problem Set", duration: "60 min", type: "Practice", completed: false },
        { id: "s3", day: "Monday", time: "14:00", subject: "Chemistry", topic: "Electrophilic Addition Reactions", duration: "45 min", type: "Study", completed: false },
        { id: "s4", day: "Monday", time: "18:00", subject: "Physics", topic: "Rotational Motion Mistake Review", duration: "30 min", type: "Revision", completed: false },
        { id: "s5", day: "Monday", time: "20:00", subject: "Biology", topic: "Diagnostic Quiz on Cell Cycle", duration: "45 min", type: "Mock", completed: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleToggleSession = async (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, completed: !s.completed } : s))
    );

    try {
      await ApiClient.togglePlannerItem(sessionId);
    } catch (err) {
      console.warn("Failed to toggle session remotely:", err);
    }
  };

  const handleReoptimizePlan = async () => {
    setIsOptimizing(true);
    try {
      const data = await ApiClient.reoptimizePlan();
      if (data && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.warn("Re-optimize plan error:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      const data = await ApiClient.addPlannerItem({
        day_name: selectedDay,
        scheduled_time: newTime,
        duration_minutes: Number(newDuration),
        subject: newSubject,
        topic: newTopic,
        activity_type: newType
      });

      if (data && data.session) {
        setSessions((prev) => [...prev, data.session]);
      }
    } catch (err) {
      setSessions((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          day: selectedDay,
          time: newTime,
          subject: newSubject,
          topic: newTopic,
          duration: `${newDuration} min`,
          type: newType,
          completed: false
        }
      ]);
    } finally {
      setNewTopic("");
      setShowAddModal(false);
    }
  };

  const visibleSessions = sessions.filter((s) => s.day === selectedDay);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Study Planner</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Personalized roadmap automatically synchronized with your exam target and spaced repetition triggers ({daysLeft} days to exam).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 font-bold border-[#151515] gap-1.5"
              onClick={handleReoptimizePlan}
              isLoading={isOptimizing}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF5734]" />
              <span>Re-optimize Plan</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-9 font-bold"
              onClick={() => setShowAddModal(true)}
            >
              + Add Session
            </Button>
          </div>
        </div>

        {/* Days Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {days.map((d, i) => (
            <div
              key={i}
              onClick={() => setSelectedDay(d.name)}
              className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                selectedDay === d.name
                  ? "bg-[#FFCC42] border-[#151515] text-[#151515] shadow-[4px_4px_0px_0px_#151515] font-bold"
                  : "bg-white border-[#E8E6DE] text-[#555555] hover:border-[#151515] hover:bg-[#FAF9F5]"
              }`}
            >
              <p className="text-sm font-display font-bold">{d.name}</p>
              <p className="text-xs mt-0.5 opacity-80">{d.date}</p>
              {d.isToday && (
                <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#151515] text-white">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Sessions for Selected Day */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
            <h3 className="text-lg font-display font-bold text-[#151515]">
              {selectedDay}'s Schedule
            </h3>
            <span className="text-xs font-bold text-[#707070]">
              {visibleSessions.filter((s) => s.completed).length} / {visibleSessions.length} Completed
            </span>
          </div>

          {visibleSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#707070] space-y-2">
              <p>No study sessions scheduled for {selectedDay}.</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="text-xs font-bold">
                + Add First Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleToggleSession(s.id)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    s.completed
                      ? "bg-[#FAF9F5] border-[#E8E6DE] opacity-70"
                      : "bg-white border-[#151515] shadow-[2px_2px_0px_0px_#151515] hover:shadow-[4px_4px_0px_0px_#151515]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        s.completed ? "bg-[#16A34A] border-[#16A34A] text-white" : "border-[#151515] bg-white"
                      }`}
                    >
                      {s.completed && <Check className="h-4 w-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#707070] font-mono">{s.time}</span>
                        <Badge
                          variant={
                            s.subject === "Physics"
                              ? "coral"
                              : s.subject === "Chemistry"
                              ? "yellow"
                              : "academic"
                          }
                          className="text-[10px] font-bold uppercase"
                        >
                          {s.subject}
                        </Badge>
                        <span className="text-[10px] font-bold text-[#6C38D4] bg-[#F0E9FD] px-2 py-0.5 rounded-full">
                          {s.type}
                        </span>
                      </div>
                      <p className={`text-sm sm:text-base font-bold text-[#151515] ${s.completed ? "line-through text-[#707070]" : ""}`}>
                        {s.topic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#707070] font-semibold shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{s.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Session Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#151515] space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
                <h3 className="text-lg font-display font-bold text-[#151515]">Add Study Session</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-[#FAF9F5]">
                  <X className="h-5 w-5 text-[#707070]" />
                </button>
              </div>

              <form onSubmit={handleAddSession} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#707070] uppercase">Day</label>
                  <p className="text-sm font-bold text-[#151515] mt-1">{selectedDay}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#707070] uppercase">Subject</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {["Physics", "Chemistry", "Biology", "Mathematics"].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setNewSubject(sub)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          newSubject === sub
                            ? "bg-[#FF5734] text-white border-[#FF5734]"
                            : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555]"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#707070] uppercase">Topic Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electromagnetic Induction Problem Set"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-2xl border-2 border-[#151515] text-xs sm:text-sm font-medium focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#707070] uppercase">Start Time</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-[#E8E6DE] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#707070] uppercase">Duration (Min)</label>
                    <input
                      type="number"
                      min={15}
                      max={180}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-[#E8E6DE] text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFEFE8]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                    Save Session
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
