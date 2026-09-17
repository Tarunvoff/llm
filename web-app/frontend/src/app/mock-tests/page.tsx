"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Play, CheckCircle2, Clock, Sparkles, BookOpen, Layers, Award, ChevronRight, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

interface MockTestItem {
  id: string;
  title: string;
  exam: string;
  duration: string;
  questions: number;
  score: string;
  accuracy: string;
  date: string;
  status: string;
}

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTestPreview, setActiveTestPreview] = useState<any | null>(null);

  const fetchMockTests = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getMockTests();
      if (data && data.mock_tests) {
        setTests(data.mock_tests);
      }
    } catch (err) {
      console.warn("Using fallback mock tests:", err);
      setTests([
        {
          id: "mock-1",
          title: "Full-Length Diagnostic Mock Test #1",
          exam: "NEET Full Syllabus",
          duration: "3 Hours",
          questions: 180,
          score: "612 / 720",
          accuracy: "85%",
          date: "Completed 3 days ago",
          status: "Completed",
        },
        {
          id: "mock-2",
          title: "Physics & Chemistry High-Yield Sectional",
          exam: "NEET Sectional",
          duration: "90 Min",
          questions: 90,
          score: "Upcoming",
          accuracy: "-",
          date: "Scheduled for Tomorrow 7 PM",
          status: "Upcoming",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMockTests();
  }, []);

  const handleGenerateMock = async () => {
    setIsGenerating(true);
    try {
      const newMock = await ApiClient.generateMockTest({
        title: "Adaptive STEM Comprehensive Mock #2",
        subject: "All",
        question_count: 5
      });

      if (newMock) {
        setActiveTestPreview(newMock);
        await fetchMockTests();
      }
    } catch (err) {
      console.warn("Mock generation fallback:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Full-Length Mock Tests</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Personalized exam simulations calibrated to your syllabus, historical mistakes, and target exam benchmark scores.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="text-xs h-9 gap-2 font-bold shadow-sm"
            onClick={handleGenerateMock}
            isLoading={isGenerating}
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Adaptive Mock Paper</span>
          </Button>
        </div>

        {/* Mock Tests List */}
        <div className="space-y-5">
          {tests.map((t) => (
            <div
              key={t.id}
              className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#151515] space-y-4 hover:shadow-[6px_6px_0px_0px_#151515] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFEFE8]">
                <div className="flex items-center gap-2.5">
                  <Badge variant={t.status === "Completed" ? "academic" : "yellow"} className="text-xs font-bold">
                    {t.status}
                  </Badge>
                  <span className="text-xs text-[#707070] font-semibold">• {t.exam}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#707070]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-[#FF5734]" />
                    {t.duration}
                  </span>
                  <span>•</span>
                  <span>{t.questions} Questions</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#151515]">{t.title}</h3>
                  <p className="text-xs text-[#555555]">
                    Scaled exam calibration with negative marking (-1) and timed sectional constraints.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-[#707070] block">Score</span>
                    <span className="text-base font-bold text-[#151515] font-display">{t.score}</span>
                  </div>

                  <a href="/practice">
                    <Button
                      variant={t.status === "Completed" ? "outline" : "primary"}
                      size="sm"
                      className="text-xs h-9 font-bold px-4"
                    >
                      {t.status === "Completed" ? "Review Analytics" : "Start Test →"}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paper Preview Modal */}
        {activeTestPreview && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[6px_6px_0px_0px_#151515] space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
                <div>
                  <Badge variant="coral" className="text-[10px] font-bold uppercase">Adaptive Simulation</Badge>
                  <h3 className="text-lg font-display font-bold text-[#151515] mt-1">{activeTestPreview.title}</h3>
                </div>
                <button onClick={() => setActiveTestPreview(null)} className="p-1 rounded-full hover:bg-[#FAF9F5]">
                  <X className="h-5 w-5 text-[#707070]" />
                </button>
              </div>

              <p className="text-xs text-[#555555]">
                {activeTestPreview.question_count} high-yield questions covering Physics, Chemistry, and Biology.
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {activeTestPreview.questions?.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E6DE] text-xs font-semibold text-[#151515]">
                    <span className="text-[#FF5734] font-bold mr-1.5">Q{idx + 1}.</span>
                    <span>{q.question_text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEFE8]">
                <Button variant="outline" size="sm" onClick={() => setActiveTestPreview(null)} className="text-xs font-bold">
                  Close Preview
                </Button>
                <a href="/practice">
                  <Button variant="primary" size="sm" className="text-xs font-bold">
                    Begin Full Simulation →
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
