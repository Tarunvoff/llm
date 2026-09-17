"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, Key, Bell, Shield, Moon, Database } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••");

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Settings & Configurations</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Manage AI intelligence provider parameters, memory persistence, and system preferences.
            </p>
          </div>
        </div>

        {/* AI Provider Section */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFEFE8]">
            <div>
              <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-2">
                <Key className="h-4 w-4 text-[#FF5734]" />
                AI Intelligence Provider
              </h3>
              <p className="text-xs text-[#555555] mt-0.5">
                Current backend implementation: <strong>Google Gemini API</strong> (with pluggable AIService architecture for HuggingFace).
              </p>
            </div>
            <Badge variant="coral" className="text-xs font-bold">
              gemini-2.5-flash
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#707070]">Gemini API Key (Configured on Backend)</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                disabled
              />
              <p className="text-xs text-[#707070] mt-1">
                API keys are securely maintained on the FastAPI backend and never exposed to the client.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" className="text-xs h-9 font-bold">
                Save AI Configuration
              </Button>
            </div>
          </div>
        </div>

        {/* Knowledge Tracing & Memory */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
          <div className="pb-4 border-b border-[#EFEFE8]">
            <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-2">
              <Database className="h-4 w-4 text-[#B99AF5]" />
              Cognitive Tracing & Memory Policy
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Control how mistake patterns, topic decay, and session history are stored.
            </p>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-3 border-b border-[#EFEFE8]">
              <div>
                <p className="font-bold text-[#151515]">Bayesian Knowledge Tracing (BKT)</p>
                <p className="text-xs text-[#707070]">Dynamically update topic mastery after each quiz attempt.</p>
              </div>
              <Badge variant="academic">Active</Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#EFEFE8]">
              <div>
                <p className="font-bold text-[#151515]">Spaced Repetition Scheduler</p>
                <p className="text-xs text-[#707070]">Auto-queue 1d, 3d, 7d, 30d review items upon mistake detection.</p>
              </div>
              <Badge variant="academic">Active</Badge>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-[#151515]">Strict Document Grounding</p>
                <p className="text-xs text-[#707070]">Require citations for textbook questions to eliminate hallucinations.</p>
              </div>
              <Badge variant="academic">Enabled</Badge>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
