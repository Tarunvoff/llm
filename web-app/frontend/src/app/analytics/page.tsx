"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Award, Zap, Brain, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ApiClient } from "@/lib/api";


interface AnalyticsOverview {
  overall_mastery: number;
  mastery_delta_week: string;
  accuracy: number;
  accuracy_total_questions: number;
  study_hours: number;
  questions_solved: number;
  streak_days: number;
  xp: number;
  total_quizzes: number;
  total_mistakes: number;
  resolved_mistakes: number;
}

interface TopicMasteryItem {
  id: string;
  topic: string;
  chapter: string;
  mastery: number;
  status: string;
  total_attempts?: number;
  correct_attempts?: number;
}

export default function AnalyticsPage() {
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [overview, setOverview] = useState<AnalyticsOverview>({
    overall_mastery: 68.4,
    mastery_delta_week: "+4.2%",
    accuracy: 78.5,
    accuracy_total_questions: 142,
    study_hours: 30.6,
    questions_solved: 142,
    streak_days: 5,
    xp: 420,
    total_quizzes: 8,
    total_mistakes: 6,
    resolved_mistakes: 3
  });
  const [topicTree, setTopicTree] = useState<Record<string, TopicMasteryItem[]>>({
    Physics: [
      { id: "t1", topic: "Kinematics & 2D Projectile Motion", chapter: "Mechanics", mastery: 82, status: "Mastered" },
      { id: "t2", topic: "Newton's Laws of Motion & Friction", chapter: "Mechanics", mastery: 74, status: "Proficient" },
      { id: "t3", topic: "Work, Energy & Power", chapter: "Mechanics", mastery: 61, status: "Progressing" },
      { id: "t4", topic: "Rotational Motion & Angular Momentum", chapter: "Mechanics", mastery: 42, status: "Needs Review" },
      { id: "t5", topic: "Electrostatics & Gauss's Law", chapter: "Electromagnetism", mastery: 79, status: "Proficient" },
    ],
    Chemistry: [
      { id: "t6", topic: "Electrophilic Addition Reactions", chapter: "Organic Chemistry", mastery: 48, status: "Needs Review" },
      { id: "t7", topic: "Thermodynamics & Enthalpy", chapter: "Physical Chemistry", mastery: 68, status: "Proficient" },
      { id: "t8", topic: "Chemical Equilibrium & Le Chatelier", chapter: "Physical Chemistry", mastery: 77, status: "Proficient" },
      { id: "t9", topic: "Periodic Classification & Radii", chapter: "Inorganic Chemistry", mastery: 88, status: "Mastered" },
    ],
    Biology: [
      { id: "t10", topic: "Cell Division (Mitosis & Meiosis)", chapter: "Cell Biology", mastery: 51, status: "Needs Review" },
      { id: "t11", topic: "Mendelian Genetics & Inheritance", chapter: "Genetics", mastery: 84, status: "Mastered" },
      { id: "t12", topic: "Photosynthesis & Light Reactions", chapter: "Plant Physiology", mastery: 71, status: "Proficient" },
      { id: "t13", topic: "Human Circulatory System", chapter: "Human Physiology", mastery: 90, status: "Mastered" },
    ],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [ovData, treeData] = await Promise.all([
        ApiClient.getAnalyticsOverview(),
        ApiClient.getMasteryTree()
      ]);

      if (ovData) setOverview(ovData);
      if (treeData && treeData.topic_tree) setTopicTree(treeData.topic_tree);
    } catch (err) {
      console.warn("Analytics live fetch fallback:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const subjects = Object.keys(topicTree);
  const currentTopics = topicTree[selectedSubject] || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Mastery & Analytics</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Bayesian Knowledge Tracing (BKT) metrics. Evaluates authentic conceptual retention without vanity bias.
            </p>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFF3F0] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BD3012]">Overall Mastery</span>
            <p className="text-3xl font-display font-bold text-[#FF5734] mt-1">{overview.overall_mastery}%</p>
            <p className="text-xs text-[#166534] font-semibold mt-1">↑ {overview.mastery_delta_week} this week</p>
          </div>

          <div className="bg-[#F0E9FD] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C38D4]">Test Accuracy</span>
            <p className="text-3xl font-display font-bold text-[#6C38D4] mt-1">{overview.accuracy}%</p>
            <p className="text-xs text-[#555555] mt-1 font-medium">Across {overview.questions_solved} questions</p>
          </div>

          <div className="bg-[#FFF9D6] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6E00]">Effective Study Time</span>
            <p className="text-3xl font-display font-bold text-[#151515] mt-1">{overview.study_hours}h</p>
            <p className="text-xs text-[#555555] mt-1 font-medium">Total active practice</p>
          </div>

          <div className="bg-[#F0FDF4] border-2 border-[#151515] p-5 rounded-3xl shadow-[3px_3px_0px_0px_#151515] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Active Streak</span>
            <p className="text-3xl font-display font-bold text-[#16A34A] mt-1">{overview.streak_days} Days</p>
            <p className="text-xs text-[#166534] font-semibold mt-1">XP Level: {overview.xp} pts</p>
          </div>
        </div>

        {/* Subject Mastery Breakdown Card */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
            <div>
              <h3 className="text-xl font-display font-bold text-[#151515]">Curriculum Mastery Graph</h3>
              <p className="text-xs text-[#555555] mt-0.5">Select a subject to inspect topic-level probabilistic retention.</p>
            </div>

            {/* Subject Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedSubject === subj
                      ? "bg-[#151515] text-white shadow-sm"
                      : "bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:border-[#151515]"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Progress Bars */}
          <div className="space-y-4">
            {currentTopics.map((t) => {
              const statusVariant =
                t.status === "Mastered"
                  ? "academic"
                  : t.status === "Proficient"
                  ? "yellow"
                  : t.status === "Progressing"
                  ? "lavender"
                  : "coral";

              return (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-2.5 hover:border-[#151515] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-[#707070]">{t.chapter}</span>
                        <span>•</span>
                        <Badge variant={statusVariant as any} className="text-[10px] font-bold">
                          {t.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-[#151515] mt-1">{t.topic}</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold text-[#151515] font-display">{t.mastery}%</span>
                      <a href="/practice">
                        <button className="px-3 py-1 rounded-xl bg-white border border-[#E8E6DE] text-xs font-bold text-[#151515] hover:border-[#151515] hover:bg-[#FAF9F5]">
                          Practice →
                        </button>
                      </a>
                    </div>
                  </div>

                  <Progress
                    value={t.mastery}
                    indicatorClassName={t.mastery >= 75 ? "bg-[#16A34A]" : t.mastery >= 55 ? "bg-[#FFCC42]" : "bg-[#FF5734]"}
                    className="h-2.5"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
