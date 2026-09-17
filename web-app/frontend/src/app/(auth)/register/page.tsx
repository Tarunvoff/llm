"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const { register, demoLogin, isLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, fullName);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
      {/* Left Column: Brand & Educational Statement */}
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
              Start your personalized study journey.
            </h2>
            <p className="text-xs sm:text-sm text-ink-400 leading-relaxed max-w-md font-normal">
              Create an account to configure your target exam, upload textbooks, track cognitive mastery, and get Socratic AI tutoring.
            </p>
          </div>
        </div>

        <div className="pt-12 space-y-3 text-xs text-ink-500 font-mono">
          <div className="flex items-center gap-2 text-ink-400">
            <CheckCircle2 className="h-4 w-4 text-academic-400 shrink-0" />
            <span>Multi-modal textbook & PDF RAG analysis</span>
          </div>
          <div className="flex items-center gap-2 text-ink-400">
            <CheckCircle2 className="h-4 w-4 text-academic-400 shrink-0" />
            <span>Mistake categorization & Bayesian knowledge tracing</span>
          </div>
          <p className="pt-4 text-[11px]">© 2026 IntelliTutor AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Register Card */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-ink-900/30">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold text-ink-100">Create Account</h3>
            <p className="text-xs text-ink-400">
              Set up your profile and proceed to academic onboarding.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Quick Demo Option */}
          <div className="p-3 rounded-lg bg-academic-950/40 border border-academic-700/40 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-academic-300 font-medium">Want to test right away?</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoClick}
              className="text-xs h-7 border-academic-700/60 text-academic-300 hover:text-white"
            >
              1-Click Demo
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-300">Full Name</label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
              />
            </div>

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
              <label className="text-xs font-medium text-ink-300">Password (min 6 characters)</label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="academic"
              size="md"
              isLoading={isLoading}
              className="w-full h-9 text-xs font-semibold"
            >
              Create Account & Onboard
            </Button>
          </form>

          <p className="text-center text-xs text-ink-400">
            Already have an account?{" "}
            <Link href="/login" className="text-academic-400 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
