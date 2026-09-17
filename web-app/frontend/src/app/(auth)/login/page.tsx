"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, Lock, Mail, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || "Failed to log in as demo student");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#151515] flex flex-col md:flex-row">
      {/* Left Column: Brand & Statement */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8E6DE] bg-white">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF5734] text-white font-display text-base font-bold shadow-sm">
              IT
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-[#151515]">
                INTELLITUTOR <span className="text-[#FF5734]">AI</span>
              </span>
              <span className="text-[11px] text-[#707070] font-medium">
                Personal Study Coach
              </span>
            </div>
          </Link>

          <div className="pt-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#151515] leading-tight">
              Welcome back to your study workspace.
            </h2>
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed max-w-md">
              IntelliTutor maintains your mastery state, tracks your mistake patterns, and organizes your daily revision queue.
            </p>
          </div>
        </div>

        <div className="pt-10 space-y-3 text-xs text-[#555555]">
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold text-[#151515]">Socratic diagnostic guidance</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold text-[#151515]">Automated spaced repetition intervals</span>
          </div>
          <p className="pt-6 text-[11px] text-[#707070]">© {new Date().getFullYear()} IntelliTutor AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-[#FAF9F5]">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-display font-bold text-[#151515]">Log In</h3>
            <p className="text-xs sm:text-sm text-[#555555]">
              Enter your credentials or use the instant demo workspace.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Quick Demo Login Button */}
          <div className="p-5 rounded-3xl bg-[#FFF3F0] border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#BD3012] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FF5734]" />
                Demo Aspirant Workspace
              </span>
              <span className="text-[10px] font-bold text-[#BD3012] bg-white px-2 py-0.5 rounded-full border border-[#FFC8BC]">NEET Preset</span>
            </div>
            <p className="text-xs text-[#555555]">
              One-click instant login loaded with diagnostic mistakes, topic mastery, and study plans.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDemoClick}
              isLoading={isLoading}
              className="w-full h-10 text-xs font-bold"
            >
              Sign In with 1-Click Demo Account
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E8E6DE] w-full" />
            <span className="bg-[#FAF9F5] px-3 text-[11px] uppercase font-bold text-[#9CA3AF] shrink-0">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#151515]">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#151515]">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              size="md"
              isLoading={isLoading}
              className="w-full h-11 text-xs sm:text-sm font-bold bg-[#151515] text-white hover:bg-[#2B2B2B]"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-[#555555]">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#FF5734] hover:underline font-bold">
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
