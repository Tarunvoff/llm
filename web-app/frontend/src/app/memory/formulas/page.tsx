"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sigma,
  Search,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Zap,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { MathRenderer, LaTeXBlock } from "@/components/ui/math-renderer";

export default function FormulaBankPage() {
  const [grouped, setGrouped] = useState<any>({});
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFormulas() {
      setIsLoading(true);
      try {
        const res = await ApiClient.getFormulaVault(
          selectedSubject === "All" ? undefined : selectedSubject,
          searchQuery.trim() || undefined
        );
        setGrouped(res.grouped_formulas || {});
      } catch (err) {
        console.error("Failed to load formula vault:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFormulas();
  }, [selectedSubject, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const subjectGroup = grouped[selectedSubject] || {};

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Formula & Equation Bank
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Cheat-Sheets</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Organized mathematical and chemical formulas with variable explanations and exam frequency ratings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["Physics", "Chemistry", "Biology"].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSubject === subj
                  ? "bg-[#151515] text-white shadow-xs"
                  : "bg-white text-[#707070] hover:text-[#151515] border border-[#E8E6DE]"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] flex items-center gap-2">
        <Search className="h-4 w-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Filter formulas by name, equation, or topic (e.g. projectile, momentum, enthalpy)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#151515] outline-none font-medium"
        />
      </div>

      {/* Grouped Chapters Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading formula bank...</div>
      ) : Object.keys(subjectGroup).length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E8E6DE] space-y-3">
          <Sigma className="h-10 w-10 mx-auto text-[#FF5734]" />
          <h3 className="text-sm font-bold text-[#151515]">No Formulas Found for {selectedSubject}</h3>
          <p className="text-xs text-[#707070] max-w-sm mx-auto">
            Extract formulas from your study notes or switch subjects above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(subjectGroup).map(([chapter, formulas]: [string, any]) => (
            <div key={chapter} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#707070] flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-[#FF5734]" />
                {chapter} ({formulas.length} formulas)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formulas.map((f: any) => (
                  <Card key={f.id} className="bg-white border-[#E8E6DE] hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-bold text-[#151515]">
                          {f.title}
                        </CardTitle>
                        <button
                          onClick={() => handleCopy(f.id, f.formula)}
                          className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#151515] hover:bg-[#FAF9F5] transition-colors"
                          title="Copy formula"
                        >
                          {copiedId === f.id ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      {/* Formula Box */}
                      <div className="p-3.5 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl flex flex-col items-center justify-center space-y-2 relative shadow-xs">
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707070]">Formula</span>
                          <Badge className="text-[9px] bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">
                            ★ {f.importance || 9.0} Yield
                          </Badge>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-[#BD3012] py-1 max-w-full overflow-x-auto text-center">
                          <LaTeXBlock latex={f.formula} displayMode={true} />
                        </div>
                      </div>

                      {/* Variables breakdown */}
                      {f.variables && Object.keys(f.variables).length > 0 && (
                        <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#EFEFE8] space-y-1">
                          <p className="text-[10px] font-bold text-[#707070] uppercase tracking-wider">Variables & Legend:</p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#555555]">
                            {Object.entries(f.variables).map(([k, v]: [string, any]) => (
                              <div key={k} className="flex items-center gap-1">
                                <LaTeXBlock latex={k} className="font-bold text-[#151515]" /> <span className="text-[#707070]">=</span> {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[#555555] text-[11px] leading-relaxed">
                        <MathRenderer content={f.summary} />
                      </div>

                      <div className="pt-2 border-t border-[#EFEFE8] flex items-center justify-between text-[10px] text-[#707070]">
                        <span>Source: {f.source}</span>
                        <Link
                          href={`/practice?subject=${encodeURIComponent(selectedSubject)}`}
                          className="font-bold text-[#FF5734] hover:underline flex items-center gap-1"
                        >
                          Practice Numerical <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
