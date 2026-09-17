"use client";

import React, { useState } from "react";
import { BookOpen, FileText, Filter, Plus, Search, Upload, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LibraryPage() {
  const [selectedSubject, setSelectedSubject] = useState("All");

  const docs = [
    {
      id: "doc1",
      title: "NCERT Class 12 Physics Textbook (Full).pdf",
      subject: "Physics",
      chapter: "All 14 Chapters",
      pages: 440,
      size: "18.4 MB",
      status: "Ready",
      indexedTopics: ["Electrostatics", "Magnetism", "Optics", "Modern Physics"],
      lastAccessed: "2 hours ago",
    },
    {
      id: "doc2",
      title: "Organic Reactions & Mechanisms Summary Notes.pdf",
      subject: "Chemistry",
      chapter: "Hydrocarbons & Carbonyls",
      pages: 48,
      size: "4.2 MB",
      status: "Ready",
      indexedTopics: ["Electrophilic Addition", "SN1 vs SN2", "Aldol Condensation"],
      lastAccessed: "Yesterday",
    },
    {
      id: "doc3",
      title: "Cell Biology & Genetics Master Lecture Slides.pdf",
      subject: "Biology",
      chapter: "Cell Division & Inheritance",
      pages: 92,
      size: "8.1 MB",
      status: "Ready",
      indexedTopics: ["Mitosis", "Meiosis", "Mendelian Genetics", "Linkage"],
      lastAccessed: "3 days ago",
    },
  ];

  const filteredDocs = selectedSubject === "All" ? docs : docs.filter((d) => d.subject === selectedSubject);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Upload Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-semibold text-ink-50">Study Library</h2>
            <p className="text-xs text-ink-400">
              Manage your personal knowledge base. Uploaded documents power Socratic RAG citations.
            </p>
          </div>

          <Button variant="academic" size="sm" className="text-xs h-8 gap-1.5 font-medium">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Material</span>
          </Button>
        </div>

        {/* Drag & Drop Upload Dropzone Preview */}
        <div className="p-6 rounded-lg border-2 border-dashed border-ink-800 hover:border-academic-700/60 bg-ink-900/30 transition-colors text-center space-y-2 cursor-pointer">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-academic-400">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-200">
              Drop textbooks, lecture notes, or handwritten PDFs here
            </p>
            <p className="text-[11px] text-ink-500 font-mono">
              Supports PDF, DOCX, TXT, PNG, JPG (Max 50MB per document)
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["All", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedSubject === subj
                    ? "bg-ink-800 text-white border border-ink-700"
                    : "text-ink-400 hover:text-ink-200"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-500" />
            <Input placeholder="Search documents & topics..." className="pl-8 h-8 text-xs" />
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-ink-800 flex items-center justify-center text-academic-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <Badge variant="academic" className="text-[9px] py-0 px-1 font-mono uppercase">
                      {doc.subject}
                    </Badge>
                    <p className="text-[10px] text-ink-500 font-mono mt-0.5">{doc.pages} Pages · {doc.size}</p>
                  </div>
                </div>
                <Badge variant="default" className="text-[9px] font-mono text-academic-400 bg-academic-950/60 border border-academic-800/40">
                  {doc.status}
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-ink-100 line-clamp-1">{doc.title}</h4>
                <p className="text-[11px] text-ink-400 mt-0.5">{doc.chapter}</p>
              </div>

              <div className="pt-2 border-t border-ink-800/60 flex flex-wrap gap-1">
                {doc.indexedTopics.map((t, idx) => (
                  <span key={idx} className="text-[10px] bg-ink-950 border border-ink-800 text-ink-400 px-1.5 py-0.5 rounded font-mono">
                    {t}
                  </span>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-ink-500 font-mono">
                <span>Accessed {doc.lastAccessed}</span>
                <span className="text-academic-400 font-semibold cursor-pointer hover:underline">
                  Index Details →
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
