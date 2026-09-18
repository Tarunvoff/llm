"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Search,
  Filter,
  Sparkles,
  Pin,
  Bookmark,
  ArrowRight,
  BookOpen,
  Plus,
  Trash2,
  HelpCircle,
  Sigma,
  Zap,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { MathRenderer, LaTeXBlock } from "@/components/ui/math-renderer";

export default function KnowledgeHubPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [extractTopic, setExtractTopic] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getKnowledgeItems({
        type: selectedType === "ALL" ? undefined : selectedType,
        subject: selectedSubject === "All" ? undefined : selectedSubject,
        search: searchQuery.trim() || undefined,
      });
      setItems(res.items);
    } catch (err) {
      console.error("Failed to load knowledge hub:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [selectedType, selectedSubject]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge();
  };

  const handleTogglePin = async (id: string) => {
    try {
      await ApiClient.togglePinKnowledge(id);
      fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge node?")) return;
    try {
      await ApiClient.deleteKnowledgeItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractText.trim() && !extractTopic.trim()) return;
    setIsExtracting(true);
    try {
      await ApiClient.extractKnowledge({
        raw_text: extractText,
        subject: selectedSubject === "All" ? "Physics" : selectedSubject,
        chapter: "General",
        topic: extractTopic || "Extracted Topic",
      });
      setIsExtractModalOpen(false);
      setExtractText("");
      setExtractTopic("");
      fetchKnowledge();
    } catch (err: any) {
      alert(err.message || "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const categories = [
    { label: "All Insights", value: "ALL" },
    { label: "Formulas & Equations", value: "FORMULA" },
    { label: "Core Concepts", value: "CONCEPT" },
    { label: "Definitions & Laws", value: "DEFINITION" },
    { label: "PYQ Patterns", value: "QUESTION_PATTERN" },
    { label: "Reactions", value: "REACTION" },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Unified Knowledge Hub
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">High-Yield</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Personal repository of synthesized formulas, key definitions, exam patterns, and conceptual insights.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsExtractModalOpen(true)}
            className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold gap-1.5 shadow-sm rounded-xl px-4 py-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFCC42]" />
            Extract from Notes
          </Button>
          <Link href="/memory/formulas">
            <Button variant="outline" className="text-xs font-bold gap-1.5 rounded-xl border-[#E8E6DE]">
              <Sigma className="h-3.5 w-3.5 text-[#FF5734]" />
              Formula Vault
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedType(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedType === cat.value
                    ? "bg-[#151515] text-white"
                    : "bg-[#FAF9F5] text-[#707070] hover:text-[#151515] border border-[#E8E6DE]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Subject Switcher */}
          <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E6DE]">
            {["All", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                  selectedSubject === subj
                    ? "bg-white text-[#BD3012] shadow-xs"
                    : "text-[#707070] hover:text-[#151515]"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search concepts, formulas, variables (e.g. angular momentum, kinetic energy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl pl-9 pr-4 py-2 text-xs text-[#151515] outline-none font-medium focus:border-[#FF5734]"
            />
          </div>
          <Button type="submit" className="bg-[#FAF9F5] hover:bg-[#EFEFE8] text-[#151515] border border-[#E8E6DE] text-xs font-bold rounded-xl px-4 py-2">
            Search
          </Button>
        </form>
      </div>

      {/* Knowledge Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading knowledge items...</div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E8E6DE] space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#FFF3F0] flex items-center justify-center text-[#FF5734]">
            <Brain className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#151515]">No Knowledge Items Found</h3>
          <p className="text-xs text-[#707070] max-w-md mx-auto">
            Click &quot;Extract from Notes&quot; or select a study chapter to parse formulas, definitions, and key exam insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`border transition-all duration-200 hover:shadow-md ${
                item.is_pinned ? "bg-[#FFFDF7] border-[#FFC8BC]" : "bg-white border-[#E8E6DE]"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          item.type === "FORMULA"
                            ? "bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]"
                            : item.type === "REACTION"
                            ? "bg-[#F0E9FD] text-[#6C38D4] border-[#E0D1FB]"
                            : "bg-[#FFF9D6] text-[#8F6E00] border-[#FFF1A3]"
                        }
                      >
                        {item.type}
                      </Badge>
                      <span className="text-[11px] font-bold text-[#707070]">
                        {item.subject} · {item.topic}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-[#151515] leading-snug">
                      {item.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.is_pinned ? "text-[#FF5734] bg-[#FFF3F0]" : "text-[#9CA3AF] hover:text-[#151515]"
                      }`}
                      title={item.is_pinned ? "Unpin note" : "Pin note"}
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Formula Callout */}
                {item.formula_equation && (
                  <div className="p-3 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl text-center overflow-x-auto text-[#BD3012] shadow-xs">
                    <LaTeXBlock latex={item.formula_equation} displayMode={true} />
                  </div>
                )}

                <div className="text-[#555555] leading-relaxed">
                  <MathRenderer content={item.content} />
                </div>

                {/* Recurring pattern */}
                {item.recurring_pattern && (
                  <div className="flex items-start gap-1.5 text-[11px] text-[#8F6E00] bg-[#FFFDF7] p-2.5 rounded-xl border border-[#FFF1A3]">
                    <Zap className="h-3.5 w-3.5 shrink-0 fill-[#FFCC42] text-[#FFCC42] mt-0.5" />
                    <span className="font-semibold">
                      <MathRenderer content={item.recurring_pattern} />
                    </span>
                  </div>
                )}

                {/* Footer with topic link and source */}
                <div className="pt-2 border-t border-[#EFEFE8] flex items-center justify-between text-[11px]">
                  <span className="text-[#707070] truncate max-w-[200px]">
                    {item.source_reference || "Study Notes"}
                  </span>
                  <Link
                    href={`/topics/${encodeURIComponent(item.topic)}`}
                    className="font-bold text-[#FF5734] hover:underline flex items-center gap-1"
                  >
                    Topic 360 Center <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Extraction Modal */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-[#E8E6DE] shadow-2xl space-y-4 animate-in fade-in-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#FFF3F0] flex items-center justify-center text-[#FF5734]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#151515]">AI Knowledge Extractor</h3>
                  <p className="text-[11px] text-[#707070]">Paste notes or definitions to automatically parse formulas, flashcards, & exam patterns.</p>
                </div>
              </div>
              <button onClick={() => setIsExtractModalOpen(false)} className="text-[#707070] hover:text-[#151515]">
                ✕
              </button>
            </div>

            <form onSubmit={handleExtractSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#151515] block mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electric Dipole & Field"
                  value={extractTopic}
                  onChange={(e) => setExtractTopic(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-3 py-2 text-xs font-medium outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#151515] block mb-1">Study Material / Text</label>
                <textarea
                  rows={6}
                  placeholder="Paste textbook excerpt, lecture summary, or key formula notes..."
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-3 text-xs font-medium outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExtractModalOpen(false)}
                  className="text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isExtracting}
                  className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl px-5"
                >
                  {isExtracting ? "Extracting..." : "Extract Knowledge"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
