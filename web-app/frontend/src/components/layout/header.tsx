"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Sparkles, Bell, Clock, Compass } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Study Workspace", subtitle: "Here is what matters today" },
  "/tutor": { title: "AI Tutor", subtitle: "Socratic guidance & document-grounded explanations" },
  "/library": { title: "Knowledge Library", subtitle: "Uploaded textbooks, notes, and topic indices" },
  "/practice": { title: "Adaptive Practice", subtitle: "Diagnostic tests generated from your error patterns" },
  "/mock-tests": { title: "Mock Tests", subtitle: "Full-length adaptive exam simulations" },
  "/mistakes": { title: "Mistake Journal", subtitle: "Your mistakes are your study map" },
  "/revision": { title: "Spaced Repetition", subtitle: "Active recall timeline & decay prevention" },
  "/planner": { title: "Study Planner", subtitle: "Dynamic calendar synchronized with your exam date" },
  "/analytics": { title: "Mastery & Analytics", subtitle: "Measuring real conceptual progression over time" },
  "/goals": { title: "Study Milestones", subtitle: "Target scores and weekly syllabus coverage" },
  "/achievements": { title: "Academic Badges", subtitle: "Milestones earned through focused practice" },
  "/profile": { title: "Student Profile", subtitle: "Target exam, study goals, and learning preferences" },
  "/settings": { title: "Settings", subtitle: "System configurations, AI parameters, and preferences" },
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
    <header className="h-14 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-ink-100 tracking-tight">
            {titleInfo.title}
          </h1>
          {pathname === "/dashboard" && user?.profile?.target_exam && (
            <Badge variant="academic" className="text-[10px] py-0 px-1.5 uppercase font-mono">
              {user.profile.target_exam} Goal
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-ink-400 font-normal">
          {titleInfo.subtitle}
        </p>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Command Search Shortcut Trigger */}
        <button
          onClick={() => router.push("/tutor")}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-ink-900 border border-ink-800 text-xs text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-colors w-48 justify-between"
        >
          <div className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-ink-500" />
            <span className="text-xs">Ask tutor / search...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-ink-800 border border-ink-700 px-1 rounded text-ink-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Daily Study Progress Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-ink-900/90 border border-ink-800 text-xs text-ink-300">
          <Clock className="h-3.5 w-3.5 text-academic-400" />
          <span className="font-mono text-[11px]">Today: 1h 45m / {user?.profile?.daily_study_hours || 3.0}h</span>
        </div>

        {/* Quick Ask AI Coach Action */}
        <Button
          size="sm"
          variant="academic"
          onClick={() => router.push("/tutor")}
          className="text-xs h-7 px-2.5 gap-1.5"
        >
          <Sparkles className="h-3 w-3" />
          <span>Ask Tutor</span>
        </Button>
      </div>
    </header>
  );
}
