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

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            />
            <Button
              variant="academic"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              className="text-xs h-8 gap-1.5 font-medium"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isUploading ? "Processing..." : "Upload Material"}</span>
            </Button>
          </div>
        </div>

        {/* Drag & Drop Upload Dropzone Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-lg border-2 border-dashed border-ink-800 hover:border-academic-700/60 bg-ink-900/30 transition-colors text-center space-y-2 cursor-pointer"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-academic-400">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-200">
              {isUploading ? uploadStatusText : "Drop textbooks, lecture notes, or handwritten PDFs here"}
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
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents & topics..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Document Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ink-500 font-mono">
            Loading your study library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-800 text-ink-400 mx-auto">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-200">No study material found</p>
              <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
                Upload your first textbook, syllabus outline, or lecture notes to activate document-grounded AI Socratic tutoring.
              </p>
            </div>
            <Button
              variant="academic"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8"
            >
              Upload Your First Document
            </Button>
          </Card>
        ) : (
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
                  <div className="flex items-center gap-1.5">
                    <Badge variant="default" className="text-[9px] font-mono text-academic-400 bg-academic-950/60 border border-academic-800/40">
                      {doc.status}
                    </Badge>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-ink-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-ink-100 line-clamp-1">{doc.title}</h4>
                  <p className="text-[11px] text-ink-400 mt-0.5">{doc.chapter}</p>
                </div>

                <div className="pt-2 border-t border-ink-800/60 flex flex-wrap gap-1">
                  {doc.extracted_topics && doc.extracted_topics.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-ink-950 border border-ink-800 text-ink-400 px-1.5 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] text-ink-500 font-mono">
                  <span>Accessed {doc.last_accessed}</span>
                  <button
                    onClick={() => handleViewDetails(doc.id)}
                    className="text-academic-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Inspect Chunks →
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document Details / Chunks Modal */}
      {selectedDocDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-ink-900 border border-ink-800 rounded-lg shadow-elevated p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-ink-800 pb-3">
              <div>
                <Badge variant="academic" className="text-[10px] font-mono uppercase">
                  {selectedDocDetails.subject}
                </Badge>
                <h3 className="text-base font-semibold text-ink-100 mt-1">
                  {selectedDocDetails.title}
                </h3>
                <p className="text-xs text-ink-400">
                  {selectedDocDetails.pages} Pages · {selectedDocDetails.chunks_count} Indexed RAG Chunks
                </p>
              </div>
              <button
                onClick={() => setSelectedDocDetails(null)}
                className="text-ink-400 hover:text-ink-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <p className="font-semibold text-ink-300 uppercase tracking-wider text-[11px] font-mono">
                Indexed Semantic Chunks & Page Excerpts
              </p>
              {selectedDocDetails.chunks && selectedDocDetails.chunks.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded bg-ink-950 border border-ink-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-academic-400">
                    <span>Chunk #{c.chunk_index + 1}</span>
                    <span>Page {c.page_number}</span>
                  </div>
                  <p className="text-ink-200 font-mono text-[11px] leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-ink-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocDetails(null)}
                className="text-xs h-8 border-ink-700"
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
