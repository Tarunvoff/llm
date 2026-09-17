"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  Shield, 
  Moon, 
  Database, 
  Download, 
  RotateCcw, 
  Sliders, 
  Check, 
  Sparkles,
  AlertCircle,
  Volume2
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api";

export default function SettingsPage() {
  const [modelName, setModelName] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [scaffoldingIntensity, setScaffoldingIntensity] = useState("adaptive");
  const [enableCitations, setEnableCitations] = useState(true);
  const [enableSoundEffects, setEnableSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await ApiClient.getSettings();
        const s = (data as any)?.settings || data;
        if (s) {
          setModelName(s.model_name || "gemini-2.5-flash");
          setTemperature(s.temperature ?? 0.7);
          setScaffoldingIntensity(s.scaffolding_intensity || "adaptive");
          setEnableCitations(s.enable_citations ?? true);
          setEnableSoundEffects(s.enable_sound_effects ?? true);
          setDarkMode(s.dark_mode ?? false);
          setEmailNotifications(s.email_notifications ?? true);
        }
      } catch (err: any) {
        console.error("Failed to load user settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);
      await ApiClient.updateSettings({
        model_name: modelName,
        temperature: Number(temperature),
        scaffolding_intensity: scaffoldingIntensity,
        enable_citations: enableCitations,
        enable_sound_effects: enableSoundEffects,
        dark_mode: darkMode,
        email_notifications: emailNotifications
      });
      setStatusMessage({ type: "success", text: "Settings and AI parameters updated successfully." });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to update settings:", err);
      setStatusMessage({ type: "error", text: "Failed to save settings: " + (err.message || "Unknown error") });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await ApiClient.exportUserData();
      
      // Convert to JSON and trigger download
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `intellitutor_academic_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ type: "success", text: "Educational data export downloaded successfully." });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("Export failed:", err);
      setStatusMessage({ type: "error", text: "Export failed: " + (err.message || "Unknown error") });
    } finally {
      setExporting(false);
    }
  };

  const handleResetHistory = async () => {
    if (!confirm("Are you sure you want to clear your conversation dialogue history? Active knowledge tracing scores and study goals will be retained.")) {
      return;
    }

    try {
      setResetting(true);
      const res = await ApiClient.resetHistory();
      setStatusMessage({ type: "success", text: res.message || "Dialogue history reset successfully." });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setStatusMessage({ type: "error", text: "Failed to reset history: " + (err.message || "Unknown error") });
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515] flex items-center gap-2">
              <SettingsIcon className="h-7 w-7 text-[#FF5734]" />
              Settings & AI Configurations
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Manage AI intelligence provider parameters, memory persistence, and system preferences.
            </p>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`border-2 rounded-2xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_0px_#151515] animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-[#E8F8F0] border-[#1E7E34] text-[#1E7E34]"
                : "bg-[#FFF3F0] border-[#FF5734] text-[#BD3012]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-xs font-bold">{statusMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* AI Intelligence Provider Section */}
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFEFE8] gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#FF5734]" />
                  AI Intelligence Provider
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Configure the primary LLM engine and pedagogical reasoning parameters.
                </p>
              </div>
              <Badge variant="coral" className="text-xs font-bold w-fit">
                {modelName}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#707070]">LLM Architecture</label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border-2 border-[#151515] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5734]"
                >
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Default High-Speed)</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
                  <option value="huggingface-custom">Custom HuggingFace / Local Inference</option>
                </select>
                <p className="text-[11px] text-[#707070]">
                  Select the underlying cognitive inference model for tutor dialogues and quiz generation.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#707070]">
                  Scaffolding Mode ({scaffoldingIntensity})
                </label>
                <select
                  value={scaffoldingIntensity}
                  onChange={(e) => setScaffoldingIntensity(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border-2 border-[#151515] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5734]"
                >
                  <option value="socratic">Strict Socratic (Never gives direct answers)</option>
                  <option value="adaptive">Adaptive Hinting (Gradually reveals hints based on student responses)</option>
                  <option value="direct">Direct Explanatory (Comprehensive step-by-step breakdown)</option>
                </select>
                <p className="text-[11px] text-[#707070]">
                  Pedagogical response strategy used when breaking down multi-step mistakes.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-[#707070]">LLM Sampling Temperature</label>
                  <span className="text-xs font-bold text-[#FF5734]">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5734] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#707070]">
                  <span>0.0 (Deterministic / Formulaic)</span>
                  <span>1.0 (Creative Exploratory)</span>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-bold uppercase text-[#707070]">Citation Policy</label>
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={enableCitations}
                    onChange={(e) => setEnableCitations(e.target.checked)}
                    className="h-4 w-4 rounded border-2 border-[#151515] text-[#FF5734] focus:ring-[#FF5734] accent-[#FF5734]"
                  />
                  <span className="text-xs font-bold text-[#151515]">
                    Require strict RAG textbook citations in responses
                  </span>
                </label>
                <p className="text-[11px] text-[#707070] mt-1">
                  When enabled, answers link directly to relevant NCERT and reference textbook sections.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                disabled={saving}
                className="text-xs h-9 font-bold"
              >
                {saving ? "Saving Changes..." : "Save AI Configuration"}
              </Button>
            </div>
          </div>

          {/* System & Experience Preferences */}
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
            <div className="pb-4 border-b border-[#EFEFE8]">
              <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#B99AF5]" />
                User Experience & Notifications
              </h3>
              <p className="text-xs text-[#555555] mt-0.5">
                Configure ambient sound cues, theme tokens, and daily study reminders.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#EFEFE8]">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-[#707070]" />
                  <div>
                    <p className="font-bold text-[#151515]">Achievement & Streak Sound Effects</p>
                    <p className="text-xs text-[#707070]">Play audio cues upon unlocking badges and correct streaks.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableSoundEffects}
                  onChange={(e) => setEnableSoundEffects(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#151515] accent-[#FF5734]"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#EFEFE8]">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-[#707070]" />
                  <div>
                    <p className="font-bold text-[#151515]">Daily Spaced Review Reminders</p>
                    <p className="text-xs text-[#707070]">Receive email alerts when high-decay mistake topics require review.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#151515] accent-[#FF5734]"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-[#707070]" />
                  <div>
                    <p className="font-bold text-[#151515]">Dark Mode Theme</p>
                    <p className="text-xs text-[#707070]">Switch between warm cream canvas and high-contrast dark palette.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#151515] accent-[#FF5734]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                disabled={saving}
                className="text-xs h-9 font-bold"
              >
                {saving ? "Saving Changes..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </form>

        {/* Cognitive Tracing, Data Export & Reset */}
        <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#151515] space-y-6">
          <div className="pb-4 border-b border-[#EFEFE8]">
            <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-2">
              <Database className="h-4 w-4 text-[#FF5734]" />
              Data Privacy, Memory Management & Export
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Export your full learning portfolio or reset conversation session logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-[#151515] rounded-2xl p-5 bg-[#FAF9F5] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-sm text-[#151515] flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#6C38D4]" />
                  Export Academic Portfolio
                </h4>
                <p className="text-xs text-[#555555] mt-1 font-medium">
                  Download your complete learning record as JSON, including mastery scores, diagnostic histories, and mistake logs.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="w-full text-xs font-bold h-9 flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Generating Export..." : "Download JSON Record"}
              </Button>
            </div>

            <div className="border-2 border-[#151515] rounded-2xl p-5 bg-[#FFF3F0] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-sm text-[#BD3012] flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-[#BD3012]" />
                  Reset Dialogue History
                </h4>
                <p className="text-xs text-[#BD3012] mt-1 font-medium">
                  Clear active dialogue sessions to start fresh tutoring contexts without losing BKT mastery scores.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetHistory}
                disabled={resetting}
                className="w-full text-xs font-bold h-9 border-[#BD3012] text-[#BD3012] hover:bg-[#FFC8BC] flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Clearing..." : "Clear Active Dialogues"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
