"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Copy,
  RotateCcw,
  BookMarked,
  Brain,
  GraduationCap,
  Calculator,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ApiClient, ChatMessage, Citation, ConversationItem } from "@/lib/api";
import { MathRenderer } from "@/components/ui/math-renderer";

export default function TutorPage() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [explanationMode, setExplanationMode] = useState("Exam-oriented");
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await ApiClient.getConversations();
      setConversations(res.conversations || []);
      if (res.conversations && res.conversations.length > 0 && !activeConvId) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await ApiClient.getConversationDetails(convId);
      setMessages(res.messages || []);
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
          id: "welcome-init",
          role: "assistant",
          content:
            "### 🎓 Welcome to your Socratic AI Study Coach\n\n" +
            "I'm grounded in your uploaded textbooks, syllabus, and exam archives with full **LaTeX math** and **step-by-step Socratic pedagogy**.\n\n" +
            "**How I can help you right now:**\n" +
            "- 📐 **Derive equations & formulas** step-by-step in $\\LaTeX$\n" +
            "- 🎯 **Deconstruct tough PYQs** and point out exam trap options\n" +
            "- 📖 **Ground answers in your NCERT/Reference notes** with exact page citations\n" +
            "- 🧠 **Diagnose root cause errors** from your Mistake Journal\n\n" +
            "Ask a question below or choose a high-yield study prompt to begin!",
          related_topics: [
            "Rotational Dynamics",
            "Conservation of Angular Momentum",
            "Markovnikov Addition",
            "Kinematics 2D",
          ],
        },
      ]);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (initialPrompt && !inputPrompt) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewSession = async () => {
    try {
      const newConv = await ApiClient.createConversation("New Study Session", selectedSubject);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: "assistant",
          content: `What concept, formula, or problem in **${selectedSubject}** would you like to explore step-by-step?`,
        },
      ]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isStreaming) return;
    setInputPrompt("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
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
        prompt: textToSend,
        explanation_mode: explanationMode,
        subject: selectedSubject,
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
        onDone: () => {
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

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append(
      "prompt",
      "Analyze this educational diagram, identify the physical principles, and guide me step-by-step."
    );

    try {
      const res = await ApiClient.analyzeDiagram(formData);
      const userImgMsg: ChatMessage = {
        id: `img-user-${Date.now()}`,
        role: "user",
        content: `📷 **Uploaded Diagram for Analysis:** \`${file.name}\``,
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

  const quickActions = [
    { label: "Derive in LaTeX", prompt: "Derive the mathematical formula for this topic step-by-step using LaTeX." },
    { label: "Give High-Yield PYQ", prompt: "Give me a high-yield previous year exam question on this concept with step-by-step reasoning." },
    { label: "Explain Simpler (ELI5)", prompt: "Explain this concept in simple, intuitive terms with a real-life analogy." },
    { label: "Common Traps & Mistakes", prompt: "What are the common traps, calculation mistakes, and careless errors students make on this topic?" },
    { label: "Test My Understanding", prompt: "Ask me a diagnostic conceptual question to test my understanding of this topic." },
  ];

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-8.5rem)]">
        
        {/* Left Column (3 cols): Sessions & Subject Switcher */}
        <div className="hidden lg:flex lg:col-span-3 flex-col border border-[#E8E6DE] rounded-2xl bg-white p-4 space-y-4 shadow-subtle">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#FF5734]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#151515]">
                Tutor Sessions
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              className="text-[11px] h-7 px-2.5 font-bold border-[#E4E2D8] text-[#151515] hover:bg-[#FAF9F5] shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>

          {/* Subject Filter Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] rounded-xl border border-[#E8E6DE]">
            {["Physics", "Chemistry", "Biology", "Math"].map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedSubject === subj
                    ? "bg-white text-[#151515] shadow-xs border border-[#E8E6DE]"
                    : "text-[#707070] hover:text-[#151515]"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {conversations.length > 0 ? (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-3 rounded-xl text-xs cursor-pointer transition-all space-y-1 ${
                    activeConvId === c.id
                      ? "bg-[#FFF3F0] text-[#BD3012] font-bold border border-[#FFC8BC] shadow-xs"
                      : "text-[#555555] hover:text-[#151515] hover:bg-[#FAF9F5] border border-transparent"
                  }`}
                >
                  <p className="truncate font-semibold text-xs">{c.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#707070]">
                    <span>{c.subject}</span>
                    <span>{c.topic || "Session"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#707070]">
                No previous sessions. Start a new one above!
              </div>
            )}
          </div>

          {/* Quick Stats Footer */}
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#151515]">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#FF5734]" /> Active Exam
              </span>
              <span className="text-[#FF5734]">NEET / JEE</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#707070]">
              <span>RAG Textbook Citations</span>
              <span className="font-bold text-[#16A34A]">Active (NCERT)</span>
            </div>
          </div>
        </div>

        {/* Center Workspace (6 cols): Chat Display & Input */}
        <div className="lg:col-span-6 flex flex-col border border-[#E8E6DE] rounded-2xl bg-white overflow-hidden shadow-subtle">
          
          {/* Top Chat Bar */}
          <div className="h-14 border-b border-[#E8E6DE] px-5 flex items-center justify-between bg-[#FAF9F5]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#FF5734] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                IT
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xs sm:text-sm text-[#151515]">
                    Socratic AI Tutor
                  </span>
                  <Badge variant="coral" className="text-[9px] font-bold py-0 h-4">
                    LaTeX Ready
                  </Badge>
                </div>
                <p className="text-[10px] text-[#707070]">Grounded in verified syllabus & textbook RAG</p>
              </div>
            </div>

            {/* Explanation Mode Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#555555]">
              <span className="text-[11px] font-semibold hidden sm:inline">Pedagogy:</span>
              <select
                value={explanationMode}
                onChange={(e) => setExplanationMode(e.target.value)}
                className="bg-white border border-[#E4E2D8] text-[#151515] text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#FF5734] shadow-xs"
              >
                <option value="Exam-oriented">🎯 Exam Mode</option>
                <option value="Intermediate">📚 Intermediate</option>
                <option value="Beginner">🌱 Beginner</option>
                <option value="Child">💡 Simple (ELI5)</option>
                <option value="Expert">🔬 Deep Rigor</option>
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
                  <div className="h-8 w-8 rounded-xl bg-[#BE94F5] text-[#151515] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 border border-[#151515] shadow-xs">
                    IT
                  </div>
                )}
                
                <div
                  className={`max-w-[90%] rounded-2xl p-4 space-y-3 transition-all ${
                    msg.role === "user"
                      ? "bg-[#FF5734] text-white font-medium shadow-sm ml-auto"
                      : "bg-white border border-[#E8E6DE] text-[#151515] leading-relaxed shadow-subtle"
                  }`}
                >
                  {/* Message Content with KaTeX Math Rendering */}
                  <div className="text-xs sm:text-sm">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <MathRenderer content={msg.content} />
                    ) : isStreaming ? (
                      <div className="flex items-center gap-2 text-[#707070] italic">
                        <Sparkles className="h-4 w-4 animate-spin text-[#FF5734]" />
                        <span>Formulating Socratic explanation in $\LaTeX$...</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Grounded Citations Excerpt */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FFF9D6] border border-[#FFF1A3] space-y-1.5 text-xs text-[#8F6E00]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-[11px]">
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
                      <p className="italic text-[#151515]/80 line-clamp-2">
                        &ldquo;{msg.citations[0].excerpt}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Related Topics / Next Step Chips */}
                  {msg.related_topics && msg.related_topics.length > 0 && (
                    <div className="pt-2 border-t border-[#EFEFE8] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                        Explore Connected Concepts:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.related_topics.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(`Tell me more about ${t} and its key formulas.`)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E8E6DE] text-[#151515] hover:border-[#FF5734] hover:text-[#FF5734] transition-colors"
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar: Copy & Feedback */}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center justify-between pt-2 text-[#707070] text-[11px] border-t border-[#EFEFE8]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="hover:text-[#151515] flex items-center gap-1 transition-colors"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-[#16A34A]" />
                              <span className="text-[#16A34A] font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy $\LaTeX$</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleSend("Can you explain this again using a simpler real-world example?")}
                          className="hover:text-[#151515] flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" /> Rephrase
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="hover:text-[#151515] flex items-center gap-1 p-0.5">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button className="hover:text-[#151515] flex items-center gap-1 p-0.5">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="px-4 py-2 border-t border-[#E8E6DE] bg-[#FAF9F5] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.prompt)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-white border border-[#E8E6DE] text-xs font-semibold text-[#555555] hover:text-[#151515] hover:border-[#FF5734] transition-colors shadow-subtle shrink-0"
              >
                ✨ {action.label}
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
              title="Upload circuit or physics diagram for AI vision analysis"
              className="h-10 w-10 border-[#E4E2D8] text-[#555555] hover:text-[#151515] shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question, enter a formula, or paste a problem..."
              className="flex-1 bg-[#FAF9F5] border border-[#E4E2D8] rounded-full px-4 py-2 text-xs sm:text-sm text-[#151515] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF5734] focus:ring-1 focus:ring-[#FF5734]"
            />
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSend()}
              isLoading={isStreaming}
              className="h-10 px-5 text-xs font-bold shrink-0 rounded-full"
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </div>
        </div>

        {/* Right Column (3 cols): Topic Context, Formulas & Grounded Materials */}
        <div className="hidden lg:flex lg:col-span-3 flex-col border border-[#E8E6DE] rounded-2xl bg-white p-5 space-y-5 shadow-subtle overflow-y-auto">
          
          <div className="flex items-center justify-between pb-2 border-b border-[#EFEFE8]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
              Active Topic Context
            </span>
            <Badge variant="yellow" className="text-[10px] font-bold">High Yield</Badge>
          </div>

          {/* Topic Card */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-display font-bold text-[#151515]">
                Rotational Dynamics & Torque
              </p>
              <p className="text-xs text-[#707070]">Physics • Chapter 7 • NEET/JEE</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#555555] font-semibold">Mastery Level</span>
                <span className="font-bold text-[#FF5734]">42%</span>
              </div>
              <Progress value={42} />
            </div>
          </div>

          {/* Key Formula Vault Quick Access */}
          <div className="pt-3 border-t border-[#EFEFE8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#151515] flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-[#FF5734]" /> Key Formulas
              </span>
              <Link href="/memory/formulas" className="text-[10px] font-bold text-[#FF5734] hover:underline">
                Vault →
              </Link>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-1">
              <span className="text-[10px] font-bold text-[#BD3012] uppercase">Angular Momentum</span>
              <div className="text-center py-1">
                <MathRenderer content="$L = I\omega = \text{constant}$" />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-1">
              <span className="text-[10px] font-bold text-[#6C38D4] uppercase">Torque Equation</span>
              <div className="text-center py-1">
                <MathRenderer content="$\vec{\tau}_{\text{net}} = I\vec{\alpha} = \frac{d\vec{L}}{dt}$" />
              </div>
            </div>
          </div>

          {/* Prerequisites Status */}
          <div className="pt-3 border-t border-[#EFEFE8] space-y-2.5">
            <p className="text-xs font-bold text-[#151515]">Prerequisites & Diagnostic Status</p>
            <div className="space-y-2 text-xs text-[#555555]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span className="text-[#166534] font-semibold text-[11px]">Kinematics 2D</span>
                </div>
                <span className="text-[10px] font-bold text-[#166534]">82%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFF3F0] border border-[#FFC8BC]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF5734] animate-pulse"></span>
                  <span className="text-[#BD3012] font-semibold text-[11px]">Angular Momentum Vector</span>
                </div>
                <span className="text-[10px] font-bold text-[#BD3012]">42%</span>
              </div>
            </div>
          </div>

          {/* Connected Textbook Source */}
          <div className="pt-3 border-t border-[#EFEFE8] space-y-2">
            <p className="text-xs font-bold text-[#151515]">Grounded Reference Notes</p>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DE] text-xs text-[#555555] space-y-1">
              <div className="flex items-center gap-1.5">
                <BookMarked className="h-3.5 w-3.5 text-[#FF5734]" />
                <p className="font-bold text-[#151515] truncate">NCERT Physics Class 11</p>
              </div>
              <p className="text-[10px] text-[#707070]">Chapter 7 • System of Particles & Rotational Motion</p>
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
              <MathRenderer content={`"${activeCitation.excerpt}"`} />
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
