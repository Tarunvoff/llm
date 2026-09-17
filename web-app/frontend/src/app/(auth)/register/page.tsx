"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, Check } from "lucide-react";
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
    <div className="min-h-screen bg-[#F7F7F2] text-[#151515] flex flex-col md:flex-row">
      {/* Left Column: Brand & Educational Statement */}
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
              Start your personalized study journey.
            </h2>
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed max-w-md">
              Create an account to configure your target exam, upload notes, track cognitive mastery, and get Socratic AI tutoring.
            </p>
          </div>
        </div>

        <div className="pt-10 space-y-3 text-xs text-[#555555]">
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold text-[#151515]">Multi-modal textbook & PDF RAG analysis</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold text-[#151515]">Mistake categorization & Bayesian knowledge tracing</span>
          </div>
          <p className="pt-6 text-[11px] text-[#707070]">© {new Date().getFullYear()} IntelliTutor AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Register Card */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-[#FAF9F5]">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-display font-bold text-[#151515]">Create Account</h3>
            <p className="text-xs sm:text-sm text-[#555555]">
              Set up your profile and proceed to academic onboarding.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Quick Demo Option */}
          <div className="p-3.5 rounded-2xl bg-[#FFF3F0] border border-[#FFC8BC] flex items-center justify-between">
            <div className="text-xs">
              <span className="text-[#BD3012] font-semibold">Want to explore instantly?</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoClick}
              className="text-xs h-7 font-bold border-[#FFC8BC] text-[#BD3012] hover:bg-white"
            >
              1-Click Demo
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#151515]">Full Name</label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
              />
            </div>

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
              <label className="text-xs font-bold text-[#151515]">Password (min 6 characters)</label>
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
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              Create Account & Onboard
            </Button>
          </form>

          <p className="text-center text-xs text-[#555555]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF5734] hover:underline font-bold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
