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
  Lightbulb,
  Check,
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
      setMessages([
        {
          id: "initial-1",
          role: "assistant",
          content:
            "### Welcome to your Socratic AI Study Coach\n\n" +
            "I am initialized with your syllabus knowledge and uploaded notes. Ask a question, paste a problem, or upload a diagram.\n\n" +
            "• **Socratic Scaffolding**: I will guide you step-by-step.\n" +
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8.5rem)]">
        {/* Left Column: Recent Conversations */}
        <div className="hidden lg:flex flex-col border border-[#E8E6DE] rounded-2xl bg-white p-4 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFEFE8]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
              Study Sessions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              className="text-[11px] h-7 px-2.5 font-bold border-[#E4E2D8] text-[#151515] hover:bg-[#FAF9F5]"
            >
              + New
            </Button>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-3 rounded-xl text-xs cursor-pointer transition-all space-y-1 ${
                    activeConvId === c.id
                      ? "bg-[#FFF3F0] text-[#BD3012] font-bold border border-[#FFC8BC]"
                      : "text-[#555555] hover:text-[#151515] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="text-[10px] text-[#707070]">
                    {c.subject} • {c.topic || "Session"}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#707070]">
                No previous sessions.
              </div>
            )}
          </div>
        </div>

        {/* Center 2 Columns: Tutor Chat Workspace */}
        <div className="lg:col-span-2 flex flex-col border border-[#E8E6DE] rounded-2xl bg-white overflow-hidden shadow-subtle">
          {/* Top Chat Bar */}
          <div className="h-14 border-b border-[#E8E6DE] px-5 flex items-center justify-between bg-[#FAF9F5]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#FF5734] text-white flex items-center justify-center font-bold text-xs">
                IT
              </div>
              <span className="font-display font-bold text-xs sm:text-sm text-[#151515]">Socratic AI Tutor</span>
              <Badge variant="coral" className="text-[10px] font-bold">
                RAG Grounded
              </Badge>
            </div>

            {/* Explanation Mode Selector */}
            <div className="flex items-center gap-2 text-xs text-[#555555]">
              <span className="text-[11px] font-semibold">Mode:</span>
              <select
                value={explanationMode}
                onChange={(e) => setExplanationMode(e.target.value)}
                className="bg-white border border-[#E4E2D8] text-[#151515] text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#FF5734]"
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F7F7F2]/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-xl bg-[#B99AF5] text-[#151515] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-[#151515]">
                    IT
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
                    msg.role === "user"
                      ? "bg-[#FF5734] text-white font-medium shadow-sm"
                      : "bg-white border border-[#E8E6DE] text-[#151515] leading-relaxed shadow-subtle"
                  }`}
                >
                  <div className="whitespace-pre-line font-sans text-xs sm:text-sm">{msg.content || (isStreaming ? "Thinking..." : "")}</div>

                  {/* Grounded Citations Excerpt Trigger */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FFF9D6] border border-[#FFF1A3] space-y-1 text-xs text-[#8F6E00]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold text-[11px]">
                          <FileText className="h-3.5 w-3.5" />
                          Source Citation • {msg.citations[0].document_title} (p. {msg.citations[0].page})
                        </span>
                        <button
                          onClick={() => setActiveCitation(msg.citations![0])}
                          className="text-[11px] text-[#8F6E00] font-bold underline hover:text-[#151515]"
                        >
                          View Excerpt →
                        </button>
                      </div>
                      <p className="italic text-[#151515]/80 line-clamp-2">"{msg.citations[0].excerpt}"</p>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {msg.recommended_action && (
                    <div className="pt-2 flex items-center justify-between border-t border-[#EFEFE8] text-xs">
                      <span className="text-[#FF5734] font-bold">{msg.recommended_action.title}</span>
                      <Link href="/practice">
                        <Button variant="outline" size="sm" className="h-7 text-xs font-bold border-[#FFC8BC] text-[#BD3012] hover:bg-[#FFF3F0]">
                          Launch Practice →
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Helpful Rating */}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center justify-between pt-2 text-[#707070] text-[11px] border-t border-[#EFEFE8]">
                      <span>Was this pedagogical explanation helpful?</span>
                      <div className="flex items-center gap-3">
                        <button className="hover:text-[#151515] flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Yes</button>
                        <button className="hover:text-[#151515] flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> No</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 border-t border-[#E8E6DE] bg-[#FAF9F5] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-white border border-[#E8E6DE] text-xs font-semibold text-[#555555] hover:text-[#151515] hover:border-[#FF5734] transition-colors shadow-subtle"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 border-t border-[#E8E6DE] bg-white flex items-center gap-2">
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
              className="h-10 w-10 border-[#E4E2D8] text-[#555555] hover:text-[#151515] shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question, request an analogy, or paste a problem..."
              className="flex-1 bg-[#FAF9F5] border border-[#E4E2D8] rounded-full px-4 py-2 text-xs sm:text-sm text-[#151515] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF5734] focus:ring-1 focus:ring-[#FF5734]"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              isLoading={isStreaming}
              className="h-10 px-5 text-xs font-bold shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Column: Active Context Panel */}
        <div className="hidden lg:flex flex-col border border-[#E8E6DE] rounded-2xl bg-white p-5 space-y-5 shadow-subtle">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
            Topic Context & Mastery
          </span>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-display font-bold text-[#151515]">Rotational Dynamics & Torque</p>
              <p className="text-xs text-[#707070]">Physics • Chapter 5</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#555555] font-semibold">Mastery Level</span>
                <span className="font-bold text-[#FF5734]">42%</span>
              </div>
              <Progress value={42} />
            </div>

            <div className="pt-3 border-t border-[#EFEFE8] space-y-2.5">
              <p className="text-xs font-bold text-[#151515]">Active Prerequisites</p>
              <div className="space-y-1.5 text-xs text-[#555555]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  <span>Kinematics Equations (82%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  <span>Newton's Laws & Friction (74%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  <span>Angular Momentum Vector (42%)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFEFE8] space-y-2">
              <p className="text-xs font-bold text-[#151515]">Grounded Textbooks</p>
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#555555] space-y-1">
                <p className="font-bold text-[#151515] truncate">NCERT Physics Part 1</p>
                <p className="text-[#707070]">Chapter 5 • Pages 140-172</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white border-2 border-[#151515] rounded-3xl shadow-[8px_8px_0px_0px_#151515] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF5734]" />
                <h3 className="text-base font-display font-bold text-[#151515]">
                  {activeCitation.document_title} (Page {activeCitation.page})
                </h3>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-[#707070] hover:text-[#151515] p-1.5 rounded-full hover:bg-[#FAF9F5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9D6] border border-[#FFF1A3] text-xs sm:text-sm text-[#151515] leading-relaxed">
              "{activeCitation.excerpt}"
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCitation(null)}
                className="text-xs h-9 font-bold border-[#E4E2D8]"
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
