"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  FileText,
  Filter,
  Plus,
  Search,
  Upload,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  X,
  Sparkles,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiClient, DocumentItem } from "@/lib/api";

export default function LibraryPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [selectedDocDetails, setSelectedDocDetails] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await ApiClient.getDocuments(selectedSubject);
      setDocuments(res.documents);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedSubject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatusText("Uploading document...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", selectedSubject === "All" ? "Physics" : selectedSubject);
    formData.append("chapter", "Chapter 1");

    try {
      setUploadStatusText("Extracting text & computing semantic chunks...");
      await ApiClient.uploadDocument(formData);
      setUploadStatusText("Gemini topic indexing complete!");
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatusText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1000);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document from your study library?")) return;
    try {
      await ApiClient.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  };

  const handleViewDetails = async (docId: string) => {
    try {
      const details = await ApiClient.getDocumentDetails(docId);
      setSelectedDocDetails(details);
    } catch (err: any) {
      alert(err.message || "Failed to load document details");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.extracted_topics && doc.extracted_topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesSearch;
  });

  const getSubjectTheme = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "physics":
        return { bg: "bg-[#FFF3F0]", border: "border-[#FFC8BC]", text: "text-[#BD3012]", icon: BookOpen, accent: "coral" };
      case "chemistry":
        return { bg: "bg-[#F0E9FD]", border: "border-[#E0D1FB]", text: "text-[#6C38D4]", icon: FileText, accent: "lavender" };
      case "biology":
        return { bg: "bg-[#FFF9D6]", border: "border-[#FFF1A3]", text: "text-[#8F6E00]", icon: GraduationCap, accent: "yellow" };
      default:
        return { bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]", text: "text-[#166534]", icon: FileSpreadsheet, accent: "academic" };
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Upload Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Knowledge Library</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Your personal study repository. Uploaded textbooks, notes, and PYQs power Socratic AI citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              className="text-xs h-9 gap-2 font-bold shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span>{isUploading ? "Processing..." : "Upload Notes"}</span>
            </Button>
          </div>
        </div>

        {/* Drag & Drop Upload Dropzone Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 rounded-3xl border-2 border-dashed border-[#E4E2D8] hover:border-[#FF5734] bg-white transition-all text-center space-y-3 cursor-pointer shadow-subtle group"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3F0] text-[#FF5734] border border-[#FFC8BC] group-hover:scale-105 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-[#151515]">
              {isUploading ? uploadStatusText : "Drop textbooks, coaching modules, or handwritten notes here"}
            </p>
            <p className="text-xs text-[#707070] mt-1">
              Supports PDF, DOCX, TXT, PNG, JPG (Max 50MB • Automatically indexed for Socratic citations)
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {["All", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedSubject === subj
                    ? "bg-[#151515] text-white shadow-sm"
                    : "bg-white text-[#555555] border border-[#E8E6DE] hover:text-[#151515] hover:bg-[#FAF9F5]"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents & topics..."
              className="pl-9 h-10 text-xs rounded-full"
            />
          </div>
        </div>

        {/* Document Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#707070]">
            Loading your study library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-10 text-center space-y-4 shadow-[6px_6px_0px_0px_#151515]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3F0] text-[#FF5734] mx-auto border border-[#FFC8BC]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-[#151515]">No study material found</h3>
              <p className="text-xs text-[#555555] mt-1 max-w-sm mx-auto">
                Upload your first textbook, syllabus outline, or lecture notes to activate note-grounded AI Socratic tutoring.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-9 font-bold"
            >
              Upload Your First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
              const theme = getSubjectTheme(doc.subject);
              const IconComp = theme.icon;

              return (
                <div
                  key={doc.id}
                  className="bg-white border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] rounded-3xl p-6 space-y-4 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Visual Document Cover */}
                    <div className={`h-28 rounded-2xl ${theme.bg} border ${theme.border} p-4 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} bg-white px-2.5 py-0.5 rounded-full border ${theme.border}`}>
                          {doc.subject}
                        </span>
                        <Badge variant="default" className="text-[10px] font-bold bg-white text-[#166534] border-[#BBF7D0]">
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <IconComp className={`h-7 w-7 ${theme.text} opacity-80`} />
                        <span className="text-[11px] font-bold text-[#555555]">{doc.pages} Pages</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-sm text-[#151515] line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-[#707070] mt-0.5">{doc.chapter}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.extracted_topics && doc.extracted_topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555] px-2 py-0.5 rounded-md font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EFEFE8] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#707070] font-medium">{doc.size}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(doc.id)}
                        className="text-xs font-bold text-[#FF5734] hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect Chunks
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-[#9CA3AF] hover:text-red-600 p-1 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Details / Chunks Modal */}
      {selectedDocDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-white border-2 border-[#151515] rounded-3xl shadow-[8px_8px_0px_0px_#151515] p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-4">
              <div>
                <Badge variant="coral" className="text-[10px] font-bold uppercase">
                  {selectedDocDetails.subject}
                </Badge>
                <h3 className="text-lg font-display font-bold text-[#151515] mt-1">
                  {selectedDocDetails.title}
                </h3>
                <p className="text-xs text-[#555555]">
                  {selectedDocDetails.pages} Pages • {selectedDocDetails.chunks_count} Indexed Semantic Chunks
                </p>
              </div>
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="text-[#707070] hover:text-[#151515] p-1.5 rounded-full hover:bg-[#FAF9F5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <p className="font-bold text-[#151515] uppercase tracking-wider text-[11px]">
                Semantic Chunks & Page Excerpts
              </p>
              {selectedDocDetails.chunks && selectedDocDetails.chunks.map((c: any, i: number) => (
                <div key={i} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#FF5734]">
                    <span>Chunk #{c.chunk_index + 1}</span>
                    <span className="text-[#707070]">Page {c.page_number}</span>
                  </div>
                  <p className="text-[#151515] text-xs leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end border-t border-[#E8E6DE]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocDetails(null)}
                className="text-xs h-9 font-bold border-[#E4E2D8]"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
