"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  Calendar,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { MathRenderer } from "@/components/ui/math-renderer";

export default function PYQArchivePage() {
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedExam, setSelectedExam] = useState("NEET");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPYQs = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getPYQs({
        exam: selectedExam,
        year: selectedYear === "ALL" ? undefined : parseInt(selectedYear),
        subject: selectedSubject === "All" ? undefined : selectedSubject,
        difficulty: selectedDifficulty === "ALL" ? undefined : selectedDifficulty,
        status_filter: statusFilter === "all" ? undefined : statusFilter,
        topic: searchQuery.trim() || undefined,
      });
      setPyqs(res.pyqs);
      setYears(res.total_available_years || []);
    } catch (err) {
      console.error("Failed to load PYQs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPYQs();
  }, [selectedExam, selectedYear, selectedSubject, selectedDifficulty, statusFilter]);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              PYQ Exam Knowledge Archive
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">37-Year Trends</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Structured Previous Year Questions with recurring pattern tags, difficulty filters, and live attempt tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["NEET", "JEE Main", "CBSE"].map((exam) => (
            <button
              key={exam}
              onClick={() => setSelectedExam(exam)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedExam === exam
                  ? "bg-[#151515] text-white shadow-xs"
                  : "bg-white text-[#707070] hover:text-[#151515] border border-[#E8E6DE]"
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE] space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E6DE]">
            {["All", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  selectedSubject === subj
                    ? "bg-white text-[#BD3012] shadow-xs"
                    : "text-[#707070] hover:text-[#151515]"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#707070]">
            <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <span>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-2.5 py-1 text-xs font-bold text-[#151515] outline-none"
            >
              <option value="ALL">All Years (2018-2024)</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#707070]">
            <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-2.5 py-1 text-xs font-bold text-[#151515] outline-none"
            >
              <option value="all">All Questions</option>
              <option value="unsolved">Unsolved</option>
              <option value="solved">Solved</option>
              <option value="incorrect">Previously Wrong</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search PYQs by topic keyword (e.g. angular momentum, mitosis, carbocation)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPYQs()}
              className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl pl-9 pr-4 py-2 text-xs text-[#151515] outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* PYQ Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading PYQ archive...</div>
      ) : pyqs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E8E6DE] space-y-3">
          <Compass className="h-10 w-10 mx-auto text-[#FF5734]" />
          <h3 className="text-sm font-bold text-[#151515]">No PYQs Found</h3>
          <p className="text-xs text-[#707070] max-w-sm mx-auto">
            Try adjusting your year or subject filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pyqs.map((p) => (
            <Card key={p.id} className="bg-white border-[#E8E6DE] hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#151515] text-white text-[10px] font-bold">
                      {p.exam_name} {p.year}
                    </Badge>
                    <Badge className="bg-[#FAF9F5] text-[#707070] border-[#E8E6DE] text-[10px]">
                      {p.subject} · {p.chapter}
                    </Badge>
                    <span className="text-[11px] font-bold text-[#707070]">{p.topic}</span>
                  </div>

                  {p.recurring_pattern_tag && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#8F6E00] bg-[#FFF9D6] px-2 py-0.5 rounded-full border border-[#FFF1A3]">
                      <Zap className="h-3 w-3 fill-[#FFCC42] text-[#FFCC42]" />
                      <span>Recurring Pattern ({p.repeat_frequency_score}x)</span>
                    </div>
                  )}
                </div>

                <div className="text-xs sm:text-sm font-bold text-[#151515] leading-relaxed">
                  <MathRenderer content={p.question_text} />
                </div>

                {p.key_formula_used && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl text-[11px] font-bold text-[#BD3012] shadow-xs">
                    <span className="text-[10px] text-[#707070] uppercase">Governing Rule:</span>
                    <MathRenderer content={p.key_formula_used} />
                  </div>
                )}

                <div className="pt-2 border-t border-[#EFEFE8] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {p.is_solved ? (
                      p.is_correct ? (
                        <span className="text-[#047857] font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Solved Correctly
                        </span>
                      ) : (
                        <span className="text-[#DC2626] font-bold flex items-center gap-1 text-[11px]">
                          <XCircle className="h-3.5 w-3.5" /> Attempted (Incorrect)
                        </span>
                      )
                    ) : (
                      <span className="text-[#707070] text-[11px]">Unattempted</span>
                    )}
                  </div>

                  <Link href={`/pyq/${p.id}`}>
                    <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold gap-1 rounded-xl px-4 py-1.5">
                      Solve & Breakdown <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
