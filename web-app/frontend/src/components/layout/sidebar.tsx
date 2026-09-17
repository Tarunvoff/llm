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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: Bot, badge: "Gemini" },
  { label: "Study Library", href: "/library", icon: BookOpen },
  { label: "Adaptive Practice", href: "/practice", icon: HelpCircle },
  { label: "Mock Tests", href: "/mock-tests", icon: FileSpreadsheet },
  { label: "Mistake Journal", href: "/mistakes", icon: AlertTriangle, badge: "2 New" },
  { label: "Revision Queue", href: "/revision", icon: RotateCcw, badge: "Today" },
  { label: "Study Planner", href: "/planner", icon: Calendar },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNav: NavItem[] = [
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Achievements", href: "/achievements", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-ink-950 border-r border-ink-800/80 transition-all duration-200 z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-ink-800/70">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-academic-700 text-white font-mono text-xs font-bold shadow-sm ring-1 ring-academic-500/50">
            IT
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs tracking-wider text-ink-100 uppercase">
                IntelliTutor
              </span>
              <span className="text-[10px] text-academic-400 font-mono tracking-tight leading-none">
                AI Study Coach
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Main Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500 font-mono">
              Workspace
            </p>
          )}
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-ink-800/90 text-white font-semibold shadow-xs border border-ink-700/40"
                    : "text-ink-400 hover:text-ink-100 hover:bg-ink-900/60"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-academic-400" : "text-ink-400 group-hover:text-ink-200"
                  )}
                />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded",
                      item.badge === "Today"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                        : item.badge === "2 New"
                        ? "bg-red-950/80 text-red-300 border border-red-800/40"
                        : "bg-academic-950/80 text-academic-300 border border-academic-800/40"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Section */}
        <div className="space-y-0.5 pt-2 border-t border-ink-800/40">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500 font-mono">
              Progression
            </p>
          )}
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-ink-800/90 text-white font-semibold border border-ink-700/40"
                    : "text-ink-400 hover:text-ink-100 hover:bg-ink-900/60"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-academic-400" : "text-ink-400")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User & Exam Info Footer */}
      <div className="p-2 border-t border-ink-800/70 space-y-1">
        {!collapsed && user?.profile && (
          <div className="mb-2 px-2 py-1.5 rounded bg-ink-900/60 border border-ink-800/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Flame className="h-3.5 w-3.5 fill-amber-400/20 text-amber-400" />
              <span className="font-mono font-medium">{user.profile.streak_days || 7}d streak</span>
            </div>
            <div className="flex items-center gap-1 text-academic-300">
              <Zap className="h-3.5 w-3.5 text-academic-400" />
              <span className="font-mono font-medium">{user.profile.xp || 580} XP</span>
            </div>
          </div>
        )}

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium text-ink-300 hover:text-ink-100 hover:bg-ink-900/60 transition-colors",
            pathname === "/profile" && "bg-ink-800 text-white"
          )}
          title={collapsed ? "Profile" : undefined}
        >
          <div className="h-5 w-5 rounded-full bg-ink-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs text-ink-200">{user?.full_name || "Aarav Sharma"}</span>
              <span className="text-[10px] text-ink-500 font-mono truncate">{user?.profile?.target_exam || "NEET"} Aspirant</span>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-1 pt-1">
          <Link
            href="/settings"
            className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-xs text-ink-400 hover:text-ink-200 hover:bg-ink-900/60"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded text-ink-400 hover:text-red-400 hover:bg-ink-900/60 transition-colors"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
