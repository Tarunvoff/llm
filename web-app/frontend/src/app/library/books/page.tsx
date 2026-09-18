"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  Filter,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true);
      try {
        const res = await ApiClient.getBooks(
          selectedSubject === "All" ? undefined : selectedSubject,
          selectedSourceType === "ALL" ? undefined : selectedSourceType
        );
        setBooks(res.books);
      } catch (err) {
        console.error("Failed to load books:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBooks();
  }, [selectedSourceType, selectedSubject]);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Reference Books & NCERT Shelf
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Curriculum</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Prioritized source material: Primary NCERT Textbooks, Standard Reference Books, and Chapterwise PYQs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "PRIMARY", "REFERENCE", "PRACTICE"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedSourceType(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedSourceType === st
                  ? "bg-[#151515] text-white"
                  : "bg-white text-[#707070] hover:text-[#151515] border border-[#E8E6DE]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading books...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books.map((b) => (
            <Card key={b.id} className="bg-white border-[#E8E6DE] hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-[#EFEFE8]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge
                      className={
                        b.source_type === "PRIMARY"
                          ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                          : b.source_type === "REFERENCE"
                          ? "bg-[#FFF9D6] text-[#8F6E00] border-[#FFF1A3]"
                          : "bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]"
                      }
                    >
                      {b.source_type} SOURCE
                    </Badge>
                    <CardTitle className="text-base font-bold text-[#151515]">
                      {b.title}
                    </CardTitle>
                    <p className="text-xs text-[#707070]">{b.author} · {b.subject}</p>
                  </div>

                  <div className="h-10 w-10 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] flex items-center justify-center text-[#151515]">
                    <BookMarked className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-[#555555] leading-relaxed">
                  {b.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#707070]">
                    <span>Chapter Progress</span>
                    <span>{b.progress_percentage}% Completed</span>
                  </div>
                  <div className="h-2 w-full bg-[#FAF9F5] rounded-full overflow-hidden border border-[#E8E6DE]">
                    <div
                      className="h-full bg-[#FF5734] rounded-full transition-all"
                      style={{ width: `${b.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {b.last_read_chapter && (
                  <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E8E6DE] text-xs text-[#707070]">
                    <span className="font-bold text-[#151515]">Last Studied:</span> {b.last_read_chapter}
                  </div>
                )}

                <div className="pt-2 border-t border-[#EFEFE8] flex items-center justify-between">
                  <span className="text-xs text-[#707070] font-bold">{b.total_chapters} Total Chapters</span>
                  <Link href={`/topics/Rotational%20Motion`}>
                    <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl px-4 py-1.5">
                      Open Book Chapters <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
