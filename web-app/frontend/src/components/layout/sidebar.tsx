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
import { LogoIcon } from "@/components/brand/logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: Bot, badge: "AI" },
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
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {/* Main Section */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              WORKSPACE
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
                  "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
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
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                      item.badge === "Today"
                        ? "bg-[#FFF9D6] text-[#8F6E00] border-[#FFF1A3]"
                        : item.badge === "2 New"
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

        {/* Secondary Section */}
        <div className="space-y-1 pt-3 border-t border-[#EFEFE8]">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              PROGRESSION
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
                  "group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-[#FFF3F0] text-[#BD3012] font-bold border border-[#FFC8BC]"
                    : "text-[#555555] hover:text-[#151515] hover:bg-[#FAF9F5]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#FF5734]" : "text-[#707070]")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
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
