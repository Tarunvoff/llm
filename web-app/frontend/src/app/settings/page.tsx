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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Settings & AI Configurations</h2>
            <p className="text-xs text-ink-400">
              Manage LLM provider parameters, pedagogical thresholds, and application preferences.
            </p>
          </div>
        </div>

        {/* AI Provider Section */}
        <Card className="space-y-4">
          <CardHeader className="pb-3 border-b border-ink-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-ink-100 flex items-center gap-2">
                  <Key className="h-4 w-4 text-academic-400" />
                  AI Intelligence Provider
                </CardTitle>
                <CardDescription>
                  Current backend implementation: <strong>Google Gemini API</strong> (with pluggable AIService architecture for HuggingFace).
                </CardDescription>
              </div>
              <Badge variant="academic" className="text-[10px] font-mono">
                gemini-2.5-flash
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-300">Gemini API Key (Configured on Backend)</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                disabled
              />
              <p className="text-[11px] text-ink-500 font-mono">
                API keys are securely held on the FastAPI backend and never exposed to the frontend client.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="academic" size="sm" className="text-xs h-8">
                Save AI Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Tracing & Memory */}
        <Card className="space-y-4">
          <CardHeader className="pb-3 border-b border-ink-800">
            <CardTitle className="text-sm font-semibold text-ink-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-academic-400" />
              Cognitive Tracing & Memory Policy
            </CardTitle>
            <CardDescription>
              Control how mistake patterns, topic decay, and session history are stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-ink-800/60">
              <div>
                <p className="font-medium text-ink-100">Bayesian Knowledge Tracing</p>
                <p className="text-[11px] text-ink-400">Dynamically update topic mastery after each quiz attempt.</p>
              </div>
              <Badge variant="academic">Active</Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-ink-800/60">
              <div>
                <p className="font-medium text-ink-100">Spaced Repetition Scheduler</p>
                <p className="text-[11px] text-ink-400">Auto-queue 1d, 3d, 7d, 30d review items on mistake detection.</p>
              </div>
              <Badge variant="academic">Active</Badge>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-ink-100">Strict Document Grounding</p>
                <p className="text-[11px] text-ink-400">Prevent hallucinations by strictly requiring citations for textbook questions.</p>
              </div>
              <Badge variant="academic">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
