"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Sparkles, Clock, BookOpen } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Study Workspace", subtitle: "Here is what deserves your attention today" },
  "/tutor": { title: "AI Tutor", subtitle: "Socratic explanations & note-grounded guidance" },
  "/library": { title: "Knowledge Library", subtitle: "Textbooks, coaching modules, notes & indices" },
  "/practice": { title: "Adaptive Practice", subtitle: "Diagnostic tests generated from your error patterns" },
  "/mock-tests": { title: "Mock Tests", subtitle: "Full-length adaptive exam simulations" },
  "/mistakes": { title: "Mistake Journal", subtitle: "Your mistakes are your study roadmap" },
  "/revision": { title: "Spaced Repetition", subtitle: "Active recall timeline & forgetting-curve prevention" },
  "/planner": { title: "Study Planner", subtitle: "Dynamic calendar synchronized with your exam target" },
  "/analytics": { title: "Mastery & Analytics", subtitle: "Measuring real conceptual progression over time" },
  "/goals": { title: "Study Milestones", subtitle: "Target scores and weekly syllabus coverage" },
  "/achievements": { title: "Academic Badges", subtitle: "Milestones earned through focused mastery" },
  "/profile": { title: "Student Profile", subtitle: "Target exam, study habits, and learning style" },
  "/settings": { title: "Settings", subtitle: "System configurations, preferences, and account" },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  const currentRoute = Object.entries(routeTitles).find(([route]) => 
    pathname === route || (route !== "/dashboard" && pathname.startsWith(route))
  );

  const titleInfo = currentRoute ? currentRoute[1] : { title: "IntelliTutor", subtitle: "Personalized Learning System" };

  return (
    <header className="h-16 border-b border-[#E8E6DE] bg-white px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-base sm:text-lg font-bold text-[#151515] tracking-tight">
            {titleInfo.title}
          </h1>
          {pathname === "/dashboard" && user?.profile?.target_exam && (
            <Badge variant="coral" className="text-[10px] py-0.5 px-2 font-bold uppercase">
              {user.profile.target_exam} Goal
            </Badge>
          )}
        </div>
        <p className="text-xs text-[#707070] font-normal hidden sm:block">
          {titleInfo.subtitle}
        </p>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Command Search Shortcut Trigger */}
        <button
          onClick={() => router.push("/tutor")}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#707070] hover:text-[#151515] hover:border-[#D2CFC2] transition-colors w-52 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#9CA3AF]" />
            <span className="text-xs font-medium">Ask tutor / search...</span>
          </div>
          <kbd className="text-[10px] font-bold bg-white border border-[#E8E6DE] px-1.5 py-0.5 rounded-md text-[#555555]">
            Ctrl+K
          </kbd>
        </button>

        {/* Daily Study Progress Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#151515]">
          <Clock className="h-3.5 w-3.5 text-[#FF5734]" />
          <span className="font-semibold text-[11px]">Today: 1h 45m / {user?.profile?.daily_study_hours || 3.0}h</span>
        </div>

        {/* Quick Ask AI Coach Action */}
        <Button
          size="sm"
          variant="primary"
          onClick={() => router.push("/tutor")}
          className="text-xs h-8 px-3.5 gap-1.5 font-bold shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask Tutor</span>
        </Button>
      </div>
    </header>
  );
}
