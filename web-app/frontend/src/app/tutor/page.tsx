"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Bot,
  BookOpen,
  HelpCircle,
  Paperclip,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  FileText,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ title: string; page: number; excerpt: string }>;
  relatedTopics?: string[];
  recommendedAction?: { title: string; type: string };
}

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "user",
      content: "Explain Kirchhoff's current and voltage laws with competitive exam tips and common pitfalls.",
    },
    {
      id: "m2",
      role: "assistant",
      content:
        "### Kirchhoff's Circuit Laws\n\n" +
        "**1. Kirchhoff's Current Law (KCL) — Junction Rule**\n" +
        "• **Statement**: The algebraic sum of currents entering any node (junction) is zero ($\\sum I = 0$).\n" +
        "• **Conservation Principle**: Conservation of electric charge.\n\n" +
        "**2. Kirchhoff's Voltage Law (KVL) — Loop Rule**\n" +
        "• **Statement**: The algebraic sum of potential differences around any closed circuit loop is zero ($\\sum V = 0$).\n" +
        "• **Conservation Principle**: Conservation of energy.\n\n" +
        "**Key Exam Pitfall & Tip**:\n" +
        "When writing loop equations with capacitors and inductors, assign consistent sign conventions: going from $(-)$ to $(+)$ across a battery is $+E$, but traversing a resistor in the direction of current is $-IR$. For bridge circuits, prefer **Nodal Analysis** at the central junction to avoid three coupled loop equations.",
      citations: [
        {
          title: "NCERT Physics Class 12 (Part 1)",
          page: 102,
          excerpt: "KCL reflects charge conservation at junction nodes.",
        },
      ],
      relatedTopics: ["Nodal Analysis", "Wheatstone Bridge", "Superposition Theorem"],
      recommendedAction: {
        title: "Solve 3 Diagnostic KCL/KVL Problems",
        type: "practice",
      },
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [explanationMode, setExplanationMode] = useState("Exam-oriented");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!inputPrompt.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputPrompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `### Pedagogical Analysis (${explanationMode} Mode)\n\nRegarding your question on **${userMsg.content}**:\n\n1. **Fundamental Principle**: Isolate the primary governing equation before substituting values.\n2. **Diagnostic Check**: Check whether any non-conservative forces (like friction) do work.\n3. **Quick Shortcut**: Dimensional analysis rules out 2 of the 4 standard exam options immediately.\n\nWould you like a diagnostic question to verify your understanding?`,
        citations: [
          {
            title: "Physics Problem Solving Guide",
            page: 45,
            excerpt: "Energy conservation applies when non-conservative work is zero.",
          },
        ],
        relatedTopics: ["Conservation of Energy", "Work-Energy Theorem"],
        recommendedAction: {
          title: "Generate Quick Quiz",
          type: "practice",
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 600);
  };

  const quickActions = [
    "Explain simpler",
    "Give realistic example",
    "Give practice question",
    "Show formula sheet",
    "Test me on this",
  ];

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Column: Recent Conversations */}
        <div className="hidden lg:flex flex-col border border-ink-800/80 rounded-lg bg-ink-900/60 p-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
              Sessions
            </span>
            <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2 text-academic-400">
              + New
            </Button>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            <div className="p-2.5 rounded-md bg-ink-800/90 border border-ink-700/50 text-xs font-medium text-white space-y-1">
              <p className="truncate">Kirchhoff's Laws & Loops</p>
              <p className="text-[10px] text-academic-400 font-mono">Physics · 2 min ago</p>
            </div>
            <div className="p-2.5 rounded-md text-xs text-ink-400 hover:text-ink-200 hover:bg-ink-800/40 cursor-pointer space-y-1">
              <p className="truncate">Rotational Angular Momentum</p>
              <p className="text-[10px] text-ink-500 font-mono">Physics · Yesterday</p>
            </div>
            <div className="p-2.5 rounded-md text-xs text-ink-400 hover:text-ink-200 hover:bg-ink-800/40 cursor-pointer space-y-1">
              <p className="truncate">Markovnikov Addition</p>
              <p className="text-[10px] text-ink-500 font-mono">Chemistry · 2d ago</p>
            </div>
          </div>
        </div>

        {/* Center 2 Columns: Tutor Chat Workspace */}
        <div className="lg:col-span-2 flex flex-col border border-ink-800/80 rounded-lg bg-ink-900/90 overflow-hidden">
          {/* Top Chat Bar */}
          <div className="h-12 border-b border-ink-800/80 px-4 flex items-center justify-between bg-ink-950/60">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-academic-400" />
              <span className="text-xs font-semibold text-ink-100">Socratic AI Tutor</span>
              <Badge variant="academic" className="text-[10px] font-mono">
                Gemini Powered
              </Badge>
            </div>

            {/* Explanation Mode Selector */}
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <span className="text-[11px]">Mode:</span>
              <select
                value={explanationMode}
                onChange={(e) => setExplanationMode(e.target.value)}
                className="bg-ink-900 border border-ink-700 text-ink-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-academic-500 font-mono"
              >
                <option value="Exam-oriented">Exam Mode</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Beginner">Beginner</option>
                <option value="Child">Child (ELI5)</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded bg-academic-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    IT
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg p-3.5 space-y-2.5 ${
                    msg.role === "user"
                      ? "bg-academic-700 text-white font-medium shadow-xs"
                      : "bg-ink-950/90 border border-ink-800/90 text-ink-200 leading-relaxed"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Citations Excerpt */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="p-2.5 rounded bg-ink-900 border border-ink-800 space-y-1 text-[11px] text-ink-300">
                      <div className="flex items-center gap-1 text-academic-400 font-mono text-[10px]">
                        <FileText className="h-3 w-3" />
                        <span>Source Citation · {msg.citations[0].title} (p. {msg.citations[0].page})</span>
                      </div>
                      <p className="italic text-ink-400">"{msg.citations[0].excerpt}"</p>
                    </div>
                  )}

                  {/* Recommended Next Action */}
                  {msg.recommendedAction && (
                    <div className="pt-1 flex items-center justify-between border-t border-ink-800/60 text-[11px]">
                      <span className="text-academic-400 font-medium">{msg.recommendedAction.title}</span>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-academic-700/60 text-academic-300">
                        Launch Practice →
                      </Button>
                    </div>
                  )}

                  {/* Helpful Feedback Actions */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between pt-1 text-ink-500 text-[10px] border-t border-ink-800/40">
                      <span>Was this helpful?</span>
                      <div className="flex items-center gap-2">
                        <button className="hover:text-ink-200"><ThumbsUp className="h-3 w-3" /></button>
                        <button className="hover:text-ink-200"><ThumbsDown className="h-3 w-3" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-400 p-2 font-mono">
                <div className="h-3 w-3 animate-spin rounded-full border border-academic-500 border-t-transparent" />
                <span>IntelliTutor is reasoning...</span>
              </div>
            )}
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 border-t border-ink-800/80 bg-ink-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputPrompt(action);
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-ink-800/80 bg-ink-950/80 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question, request a derivation, or paste a problem..."
              className="flex-1 bg-ink-900 border border-ink-700/60 rounded-md px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-academic-500"
            />
            <Button
              variant="academic"
              size="sm"
              onClick={handleSend}
              className="h-8 px-3 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right Column: Active Context Panel */}
        <div className="hidden lg:flex flex-col border border-ink-800/80 rounded-lg bg-ink-900/60 p-4 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
            Topic Context
          </span>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-ink-200">Current Electricity</p>
              <p className="text-[11px] text-ink-500 font-mono">Physics · Chapter 3</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Mastery Level</span>
                <span className="font-mono text-academic-400 font-semibold">74%</span>
              </div>
              <Progress value={74} />
            </div>

            <div className="pt-2 border-t border-ink-800/60 space-y-2">
              <p className="text-[11px] font-semibold text-ink-300">Related Prerequisites</p>
              <div className="space-y-1 text-xs text-ink-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-academic-400" />
                  <span>Ohm's Law & Resistance (88%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-academic-400" />
                  <span>EMF & Internal Resistance (80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Potentiometer Principles (58%)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-ink-800/60 space-y-2">
              <p className="text-[11px] font-semibold text-ink-300">Grounded Textbooks</p>
              <div className="p-2.5 rounded bg-ink-950 border border-ink-800 text-[11px] text-ink-400 space-y-1">
                <p className="font-medium text-ink-200 truncate">NCERT Physics Part 1</p>
                <p className="text-ink-500 font-mono">Chapter 3 · Pages 90-124</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
