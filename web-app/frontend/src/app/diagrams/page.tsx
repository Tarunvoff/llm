"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  Layers,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Sigma,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function DiagramsPage() {
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"simplified" | "detailed">("simplified");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedLabel, setSelectedLabel] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDiagrams() {
      setIsLoading(true);
      try {
        const res = await ApiClient.getDiagrams(selectedSubject);
        setDiagrams(res.diagrams);
        if (res.diagrams.length > 0) {
          const detailed = await ApiClient.getDiagramDetails(res.diagrams[0].id);
          setSelectedDiagram(detailed);
        }
      } catch (err) {
        console.error("Failed to load diagrams:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDiagrams();
  }, [selectedSubject]);

  const handleSelectDiagram = async (id: string) => {
    try {
      const detailed = await ApiClient.getDiagramDetails(id);
      setSelectedDiagram(detailed);
      setSelectedLabel(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Visual Diagram Engine
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Concept Maps</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Simplified pedagogical SVG architectures for cell biology, rotational dynamics, optics, and chemical mechanisms.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E6DE]">
          {["All", "Physics", "Biology", "Chemistry"].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedSubject === subj
                  ? "bg-[#151515] text-white"
                  : "text-[#707070] hover:text-[#151515]"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading diagrams...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Diagrams Sidebar List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#707070]">
              AVAILABLE DIAGRAMS ({diagrams.length})
            </h2>
            <div className="space-y-2">
              {diagrams.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDiagram(d.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedDiagram?.id === d.id
                      ? "bg-white border-[#FF5734] shadow-md ring-1 ring-[#FF5734]"
                      : "bg-white border-[#E8E6DE] hover:border-[#9CA3AF]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC] text-[9px]">{d.subject}</Badge>
                    <span className="text-[10px] text-[#707070]">{d.labels_count} Interactive Labels</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#151515] mt-1.5">{d.title}</h3>
                  <p className="text-[11px] text-[#707070] mt-0.5">{d.topic}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Visualizer Area */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDiagram ? (
              <Card className="bg-white border-[#E8E6DE] overflow-hidden shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E8E6DE] flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-[#151515]">
                      {selectedDiagram.title}
                    </CardTitle>
                    <p className="text-xs text-[#707070] mt-0.5">
                      {selectedDiagram.subject} · {selectedDiagram.chapter}
                    </p>
                  </div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E6DE]">
                    <button
                      onClick={() => setViewMode("simplified")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        viewMode === "simplified"
                          ? "bg-white text-[#BD3012] shadow-xs"
                          : "text-[#707070] hover:text-[#151515]"
                      }`}
                    >
                      Simplified
                    </button>
                    <button
                      onClick={() => setViewMode("detailed")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        viewMode === "detailed"
                          ? "bg-white text-[#BD3012] shadow-xs"
                          : "text-[#707070] hover:text-[#151515]"
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* SVG Render Container */}
                  <div
                    className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-2xl p-4 overflow-hidden flex items-center justify-center min-h-[300px]"
                    dangerouslySetInnerHTML={{
                      __html:
                        viewMode === "simplified"
                          ? selectedDiagram.simplified_view_code
                          : selectedDiagram.detailed_view_code,
                    }}
                  />

                  {/* Interactive Labels & Explanation */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#707070]">
                      KEY ANATOMY & LABELS
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedDiagram.labels?.map((label: any) => (
                        <div
                          key={label.id}
                          onClick={() => setSelectedLabel(label)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedLabel?.id === label.id
                              ? "bg-[#FFF3F0] border-[#FFC8BC] text-[#BD3012]"
                              : "bg-[#FAF9F5] border-[#E8E6DE] hover:bg-white text-[#151515]"
                          }`}
                        >
                          <span className="text-xs font-bold block">{label.name}</span>
                          <span className="text-[10px] text-[#707070] line-clamp-1">{label.description}</span>
                        </div>
                      ))}
                    </div>

                    {selectedLabel && (
                      <div className="p-3 bg-[#FFFDF7] border border-[#FFF1A3] rounded-xl text-xs space-y-1">
                        <span className="font-bold text-[#8F6E00]">{selectedLabel.name}</span>
                        <p className="text-[#555555]">{selectedLabel.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Related Equations */}
                  {selectedDiagram.related_formulas?.length > 0 && (
                    <div className="p-4 bg-[#FAF9F5] border border-[#E8E6DE] rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-[#151515] flex items-center gap-1.5">
                        <Sigma className="h-3.5 w-3.5 text-[#FF5734]" /> Governing Equations in this Diagram
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedDiagram.related_formulas.map((rf: any, i: number) => (
                          <div key={i} className="p-2 bg-white rounded-xl border border-[#E8E6DE] font-mono text-xs font-bold text-[#BD3012]">
                            {rf.name}: {rf.formula}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#EFEFE8]">
                    <span className="text-xs text-[#707070]">{selectedDiagram.explanation}</span>
                    <Link href={`/topics/${encodeURIComponent(selectedDiagram.topic)}`}>
                      <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl px-4 py-2">
                        Topic 360 Center <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E6DE]">
                Select a diagram from the left panel to inspect.
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
