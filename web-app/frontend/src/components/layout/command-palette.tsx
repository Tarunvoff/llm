"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Brain,
  FileText,
  HelpCircle,
  AlertTriangle,
  Layers,
  Film,
  X,
  ArrowRight,
  Sparkles,
  Command,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await ApiClient.globalSearch(query);
        setResults(res.results);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const hasAnyResults =
    results &&
    (results.knowledge?.length > 0 ||
      results.flashcards?.length > 0 ||
      results.pyqs?.length > 0 ||
      results.mistakes?.length > 0 ||
      results.videos?.length > 0 ||
      results.documents?.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8E6DE] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8E6DE] gap-3 bg-[#FAF9F5]">
          <Search className="h-5 w-5 text-[#707070] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search formulas, concepts, PYQs, flashcards, mistakes, or videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#151515] placeholder:text-[#9CA3AF] outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-[#707070] hover:text-[#151515]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-[#E8E6DE] text-[10px] font-bold text-[#707070]">
            <span>ESC</span>
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-xs text-[#707070] flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-[#FF5734]" />
              Searching knowledge repository...
            </div>
          )}

          {!isLoading && !query && (
            <div className="py-6 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-[#FFF3F0] flex items-center justify-center text-[#FF5734]">
                <Command className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-[#151515]">IntelliTutor Global Study Search</p>
              <p className="text-[11px] text-[#707070] max-w-sm mx-auto">
                Type any formula name, exam keyword, chapter, or question to instantly retrieve connected materials.
              </p>
            </div>
          )}

          {!isLoading && query && !hasAnyResults && (
            <div className="py-8 text-center text-xs text-[#707070]">
              No exact matches found for &quot;{query}&quot;. Try searching for &quot;Angular Momentum&quot;, &quot;Mitosis&quot;, or &quot;Markovnikov&quot;.
            </div>
          )}

          {!isLoading && results && (
            <div className="space-y-4">
              {/* Knowledge Items */}
              {results.knowledge?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#707070] flex items-center gap-1.5">
                    <Brain className="h-3 w-3 text-[#FF5734]" /> KNOWLEDGE & FORMULAS
                  </p>
                  <div className="space-y-1">
                    {results.knowledge.map((k: any) => (
                      <div
                        key={k.id}
                        onClick={() => navigateTo(`/topics/${encodeURIComponent(k.topic)}`)}
                        className="p-2.5 rounded-xl hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E6DE] cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF3F0] text-[#BD3012]">
                            {k.type}
                          </span>
                          <span className="text-xs font-semibold text-[#151515] group-hover:text-[#FF5734]">
                            {k.title}
                          </span>
                          <span className="text-[10px] text-[#707070]">({k.topic})</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#151515]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {results.flashcards?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#EFEFE8]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#707070] flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-[#8B5CF6]" /> SMART FLASHCARDS
                  </p>
                  <div className="space-y-1">
                    {results.flashcards.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => navigateTo("/flashcards")}
                        className="p-2.5 rounded-xl hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E6DE] cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#151515] line-clamp-1">{c.front}</span>
                          <span className="text-[10px] text-[#707070]">· {c.topic}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#151515]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PYQs */}
              {results.pyqs?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#EFEFE8]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#707070] flex items-center gap-1.5">
                    <HelpCircle className="h-3 w-3 text-[#10B981]" /> PREVIOUS YEAR QUESTIONS
                  </p>
                  <div className="space-y-1">
                    {results.pyqs.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => navigateTo(`/pyq/${p.id}`)}
                        className="p-2.5 rounded-xl hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E6DE] cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857]">
                            {p.exam_name} {p.year}
                          </span>
                          <span className="text-xs font-medium text-[#151515] line-clamp-1">{p.question_snippet}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#151515]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {results.videos?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#EFEFE8]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#707070] flex items-center gap-1.5">
                    <Film className="h-3 w-3 text-[#E5A100]" /> RECOMMENDED VIDEOS
                  </p>
                  <div className="space-y-1">
                    {results.videos.map((v: any) => (
                      <div
                        key={v.id}
                        onClick={() => navigateTo("/resources/videos")}
                        className="p-2.5 rounded-xl hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E6DE] cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#151515]">{v.title}</span>
                          <span className="text-[10px] text-[#707070]">({v.channel} · {v.duration_minutes}m)</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#151515]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-[#FAF9F5] border-t border-[#E8E6DE] flex items-center justify-between text-[10px] text-[#707070]">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-[#E8E6DE] rounded font-bold">↵</kbd> to select</span>
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-[#E8E6DE] rounded font-bold">ESC</kbd> to close</span>
          </div>
          <span className="font-bold text-[#FF5734]">IntelliTutor Knowledge System</span>
        </div>
      </div>
    </div>
  );
}
