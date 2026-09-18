"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Calendar,
  BarChart3,
  Target,
  Trophy,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Brain,
  Layers,
  Sparkles,
  BookMarked,
  Film,
  Compass,
  Search,
  Sigma,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { LogoIcon } from "@/components/brand/logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupName: "WORKSPACE",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    groupName: "LEARN",
    items: [
      { label: "AI Socratic Tutor", href: "/tutor", icon: Bot, badge: "AI" },
      { label: "Knowledge Hub", href: "/knowledge", icon: Brain, badge: "New" },
      { label: "Study Library", href: "/library", icon: BookOpen },
      { label: "Reference Books", href: "/library/books", icon: BookMarked },
    ]
  },
  {
    groupName: "PRACTICE",
    items: [
      { label: "Adaptive Practice", href: "/practice", icon: HelpCircle },
      { label: "PYQ Exam Archive", href: "/pyq", icon: Compass, badge: "2018-24" },
      { label: "Mock Tests", href: "/mock-tests", icon: FileSpreadsheet },
    ]
  },
  {
    groupName: "REMEMBER",
    items: [
      { label: "Smart Flashcards", href: "/flashcards", icon: Layers, badge: "Recall" },
      { label: "Spaced Revision", href: "/revision", icon: RotateCcw, badge: "Today" },
      { label: "Formula & Memory", href: "/memory", icon: Sigma },
      { label: "Quick Recall", href: "/recall", icon: Timer },
    ]
  },
  {
    groupName: "UNDERSTAND",
    items: [
      { label: "Visual Diagrams", href: "/diagrams", icon: Sparkles },
      { label: "Video Recommender", href: "/resources/videos", icon: Film },
    ]
  },
  {
    groupName: "ANALYSE",
    items: [
      { label: "Mistake Journal", href: "/mistakes", icon: AlertTriangle, badge: "Review" },
      { label: "Learning Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Study Planner", href: "/planner", icon: Calendar },
      { label: "Goals & Milestones", href: "/goals", icon: Target },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-white border-r border-[#E8E6DE] transition-all duration-200 z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#E8E6DE]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
          <LogoIcon className="h-8 w-8 shrink-0 group-hover:scale-105 transition-transform" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-xs tracking-tight text-[#151515]">
                Intelli<span className="text-[#FF5734]">Tutor</span> <span className="text-[#151515]">AI</span>
              </span>
              <span className="text-[10px] text-[#707070] font-medium leading-none">
                Study Coach
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded-lg flex items-center justify-center text-[#707070] hover:text-[#151515] hover:bg-[#FAF9F5] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {group.groupName}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-[#FFF3F0] text-[#BD3012] font-bold border border-[#FFC8BC]"
                      : "text-[#555555] hover:text-[#151515] hover:bg-[#FAF9F5]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-[#FF5734]" : "text-[#707070] group-hover:text-[#151515]"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-[11px]">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border",
                        item.badge === "Today"
                          ? "bg-[#FFF9D6] text-[#8F6E00] border-[#FFF1A3]"
                          : item.badge === "New" || item.badge === "AI"
                          ? "bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]"
                          : "bg-[#F0E9FD] text-[#6C38D4] border-[#E0D1FB]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User & Exam Info Footer */}
      <div className="p-3 border-t border-[#E8E6DE] space-y-2 bg-[#FAF9F5]">
        {!collapsed && user?.profile && (
          <div className="px-3 py-2 rounded-xl bg-white border border-[#E8E6DE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#8F6E00]">
              <Flame className="h-3.5 w-3.5 fill-[#FFCC42] text-[#FFCC42]" />
              <span className="font-bold">{user.profile.streak_days || 12}d streak</span>
            </div>
            <div className="flex items-center gap-1 text-[#6C38D4]">
              <Zap className="h-3.5 w-3.5 text-[#B99AF5] fill-[#B99AF5]" />
              <span className="font-bold">{user.profile.xp || 580} XP</span>
            </div>
          </div>
        )}

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
            pathname === "/profile" ? "bg-white border border-[#E8E6DE] text-[#151515]" : "text-[#555555] hover:text-[#151515] hover:bg-white"
          )}
          title={collapsed ? "Profile" : undefined}
        >
          <div className="h-7 w-7 rounded-full bg-[#FFCC42] border border-[#151515] flex items-center justify-center text-xs font-bold text-[#151515] shrink-0">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-bold text-[#151515]">{user?.full_name || "Aarav Sharma"}</span>
              <span className="text-[10px] text-[#707070] truncate">{user?.profile?.target_exam || "NEET"} Aspirant</span>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-1 pt-1">
          <Link
            href="/settings"
            className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[#707070] hover:text-[#151515] hover:bg-white transition-colors"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#707070] hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
