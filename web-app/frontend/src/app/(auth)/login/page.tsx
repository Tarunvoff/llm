"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, Lock, Mail, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col md:flex-row">
      {/* Left Column: Brand & Statement */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-ink-800/80 bg-ink-950/60">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-academic-700 text-white font-mono text-sm font-bold shadow-sm ring-1 ring-academic-500/50">
              IT
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-wider uppercase text-ink-100">
                IntelliTutor AI
              </span>
              <span className="text-[11px] text-academic-400 font-mono">
                Personal Study Coach
              </span>
            </div>
          </Link>

          <div className="pt-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-50">
              Welcome back to your study workspace.
            </h2>
            <p className="text-xs sm:text-sm text-ink-400 leading-relaxed max-w-md font-normal">
              IntelliTutor maintains your mastery state, tracks your mistake patterns, and organizes your daily revision queue.
            </p>
          </div>
        </div>

        <div className="pt-12 space-y-3 text-xs text-ink-500 font-mono">
          <div className="flex items-center gap-2 text-ink-400">
            <CheckCircle2 className="h-4 w-4 text-academic-400 shrink-0" />
            <span>Socratic diagnostic guidance</span>
          </div>
          <div className="flex items-center gap-2 text-ink-400">
            <CheckCircle2 className="h-4 w-4 text-academic-400 shrink-0" />
            <span>Automated spaced repetition intervals</span>
          </div>
          <p className="pt-4 text-[11px]">© 2026 IntelliTutor AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-ink-900/30">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold text-ink-100">Log In</h3>
            <p className="text-xs text-ink-400">
              Enter your credentials or use the instant demo workspace.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Quick Demo Login Button */}
          <div className="p-3.5 rounded-lg bg-academic-950/60 border border-academic-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-academic-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-academic-400" />
                Demo Aspirant Workspace
              </span>
              <span className="text-[10px] font-mono text-academic-400">NEET Preset</span>
            </div>
            <p className="text-[11px] text-ink-400">
              One-click instant login loaded with diagnostic mistakes, topic mastery, and study plans.
            </p>
            <Button
              type="button"
              variant="academic"
              size="sm"
              onClick={handleDemoClick}
              isLoading={isLoading}
              className="w-full h-8 text-xs font-medium"
            >
              Sign In with 1-Click Demo Account
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-ink-800 w-full" />
            <span className="bg-ink-950 px-2 text-[10px] uppercase font-mono text-ink-500 shrink-0">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-300">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-300">Password</label>
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
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-9 text-xs font-semibold"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-ink-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-academic-400 hover:underline font-medium">
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
