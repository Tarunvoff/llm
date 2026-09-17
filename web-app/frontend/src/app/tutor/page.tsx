"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
  Image as ImageIcon,
  X,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiClient, ChatMessage, Citation, ConversationItem } from "@/lib/api";

export default function TutorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [explanationMode, setExplanationMode] = useState("Exam-oriented");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await ApiClient.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0 && !activeConvId) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await ApiClient.getConversationDetails(convId);
      setMessages(res.messages);
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      // Default initial message if empty
      setMessages([
        {
          id: "initial-1",
          role: "assistant",
          content:
            "### Welcome to your Socratic AI Study Coach\n\n" +
            "I am initialized with your syllabus knowledge and uploaded notes. Ask a question, paste a problem, or upload a circuit/geometry diagram.\n\n" +
            "• **Socratic Scaffolding**: I will guide you with diagnostic hints.\n" +
            "• **Grounded Citations**: Explanations cite your uploaded textbook pages.\n" +
            "• **Custom Pedagogy**: Switch explanation styles above anytime.",
          related_topics: ["Mechanics", "Electrostatics", "Organic Chemistry"],
        },
      ]);
    }
  }, [activeConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewSession = async () => {
    try {
      const newConv = await ApiClient.createConversation("New Study Session", "Physics");
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([
        {
          id: "init",
          role: "assistant",
          content: "What concept or problem would you like to explore together today?",
        },
      ]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isStreaming) return;
    const userText = inputPrompt;
    setInputPrompt("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      explanation_mode: explanationMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const tempAsstId = `asst-${Date.now()}`;
    let accumulatedText = "";
    let currentCitations: Citation[] = [];

    // Add empty placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: tempAsstId,
        role: "assistant",
        content: "",
        explanation_mode: explanationMode,
        citations: [],
      },
    ]);

    await ApiClient.streamTutorChat(
      {
        conversation_id: activeConvId || undefined,
        prompt: userText,
        explanation_mode: explanationMode,
        subject: "Physics",
      },
      {
        onInit: (data) => {
          if (!activeConvId && data.conversation_id) {
            setActiveConvId(data.conversation_id);
            fetchConversations();
          }
          currentCitations = data.citations || [];
        },
        onChunk: (chunk) => {
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAsstId
                ? {
                    ...m,
                    content: accumulatedText,
                    citations: currentCitations,
                  }
                : m
            )
          );
        },
        onDone: (messageId) => {
          setIsStreaming(false);
          fetchConversations();
        },
        onError: (err) => {
          console.error("Streaming error:", err);
          setIsStreaming(false);
        },
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("prompt", "Analyze this educational diagram, identify the physical principles, and guide me step-by-step.");

    try {
      const res = await ApiClient.analyzeDiagram(formData);
      const userImgMsg: ChatMessage = {
        id: `img-user-${Date.now()}`,
        role: "user",
        content: `[Attached Diagram: ${file.name}]`,
      };
      const asstImgMsg: ChatMessage = {
        id: `img-asst-${Date.now()}`,
        role: "assistant",
        content: res.analysis,
      };
      setMessages((prev) => [...prev, userImgMsg, asstImgMsg]);
    } catch (err: any) {
      alert(err.message || "Failed to analyze image");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleQuickAction = (actionText: string) => {
    setInputPrompt(actionText);
  };

  const quickActions = [
    "Explain simpler",
    "Give realistic example",
    "Give practice question",
    "Show formula derivation",
    "Test me on this topic",
  ];

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Column: Recent Conversations */}
        <div className="hidden lg:flex flex-col border border-ink-800/80 rounded-lg bg-ink-900/60 p-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
              Study Sessions
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSession}
              className="text-[11px] h-6 px-2 text-academic-400 hover:text-academic-300"
            >
              + New
            </Button>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-2.5 rounded-md text-xs cursor-pointer transition-colors space-y-1 ${
                    activeConvId === c.id
                      ? "bg-ink-800 text-white font-medium border border-ink-700/60"
                      : "text-ink-400 hover:text-ink-200 hover:bg-ink-800/40"
                  }`}
                >
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-[10px] text-academic-400 font-mono">
                    {c.subject} · {c.topic || "Session"}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-ink-500 font-mono">
                No previous sessions.
              </div>
            )}
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
                Gemini RAG Active
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
                  <div className="whitespace-pre-line font-sans">{msg.content || (isStreaming ? "Thinking..." : "")}</div>

                  {/* Grounded Citations Excerpt Trigger */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="p-2.5 rounded bg-ink-900 border border-ink-800 space-y-1 text-[11px] text-ink-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-academic-400 font-mono text-[10px]">
                          <FileText className="h-3 w-3" />
                          Source Citation · {msg.citations[0].document_title} (p. {msg.citations[0].page})
                        </span>
                        <button
                          onClick={() => setActiveCitation(msg.citations![0])}
                          className="text-[10px] text-academic-400 font-semibold underline hover:text-white"
                        >
                          View Excerpt →
                        </button>
                      </div>
                      <p className="italic text-ink-400 line-clamp-2">"{msg.citations[0].excerpt}"</p>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {msg.recommended_action && (
                    <div className="pt-1 flex items-center justify-between border-t border-ink-800/60 text-[11px]">
                      <span className="text-academic-400 font-medium">{msg.recommended_action.title}</span>
                      <Link href="/practice">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-academic-700/60 text-academic-300">
                          Launch Practice →
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Helpful Rating */}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center justify-between pt-1 text-ink-500 text-[10px] border-t border-ink-800/40">
                      <span>Was this pedagogical hint helpful?</span>
                      <div className="flex items-center gap-2">
                        <button className="hover:text-ink-200"><ThumbsUp className="h-3 w-3" /></button>
                        <button className="hover:text-ink-200"><ThumbsDown className="h-3 w-3" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 border-t border-ink-800/80 bg-ink-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action)}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-ink-900 border border-ink-800 text-[11px] text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-ink-800/80 bg-ink-950/80 flex items-center gap-2">
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => imageInputRef.current?.click()}
              isLoading={isUploadingImage}
              title="Upload circuit or physics diagram"
              className="h-8 w-8 border-ink-700 text-ink-400 hover:text-ink-200 shrink-0"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
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
              isLoading={isStreaming}
              className="h-8 px-3 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right Column: Active Context Panel */}
        <div className="hidden lg:flex flex-col border border-ink-800/80 rounded-lg bg-ink-900/60 p-4 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
            Topic Context & Mastery
          </span>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-ink-200">Rotational Dynamics & Torque</p>
              <p className="text-[11px] text-ink-500 font-mono">Physics · Chapter 5</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Mastery Level</span>
                <span className="font-mono text-amber-400 font-semibold">42%</span>
              </div>
              <Progress value={42} colorClass="bg-red-500" />
            </div>

            <div className="pt-2 border-t border-ink-800/60 space-y-2">
              <p className="text-[11px] font-semibold text-ink-300">Active Prerequisites</p>
              <div className="space-y-1 text-xs text-ink-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-academic-400" />
                  <span>Kinematics Equations (82%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-academic-400" />
                  <span>Newton's Laws & Friction (74%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                  <span>Angular Momentum Vector (42%)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-ink-800/60 space-y-2">
              <p className="text-[11px] font-semibold text-ink-300">Grounded Textbooks</p>
              <div className="p-2.5 rounded bg-ink-950 border border-ink-800 text-[11px] text-ink-400 space-y-1">
                <p className="font-medium text-ink-200 truncate">NCERT Physics Part 1</p>
                <p className="text-ink-500 font-mono">Chapter 5 · Pages 140-172</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-ink-900 border border-ink-800 rounded-lg shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-academic-400" />
                <h3 className="text-sm font-semibold text-ink-100">
                  {activeCitation.document_title} (Page {activeCitation.page})
                </h3>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-ink-400 hover:text-ink-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded bg-ink-950 border border-ink-800 text-xs text-ink-200 font-mono leading-relaxed">
              "{activeCitation.excerpt}"
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCitation(null)}
                className="text-xs h-8 border-ink-700"
              >
                Close Citation
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
