"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
  Flame,
  Zap,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { MathRenderer } from "@/components/ui/math-renderer";

export default function FlashcardsPage() {
  const [summary, setSummary] = useState<any>({ total_cards: 0, due_today: 0, new: 0, learning: 0, mastered: 0 });
  const [cards, setCards] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  const [currentTrainerIndex, setCurrentTrainerIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const allRes = await ApiClient.getFlashcards({
        subject: selectedSubject === "All" ? undefined : selectedSubject,
      });
      setSummary(allRes.summary);
      setCards(allRes.cards);

      const dueRes = await ApiClient.getDueFlashcards(selectedSubject);
      setDueCards(dueRes.cards);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [selectedSubject]);

  const handleStartTrainer = () => {
    if (dueCards.length === 0 && cards.length === 0) {
      alert("No flashcards available in this deck.");
      return;
    }
    setCurrentTrainerIndex(0);
    setIsFlipped(false);
    setIsTrainerOpen(true);
  };

  const handleReviewRating = async (rating: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    const activeDeck = dueCards.length > 0 ? dueCards : cards;
    const currentCard = activeDeck[currentTrainerIndex];
    if (!currentCard) return;

    try {
      await ApiClient.reviewFlashcard(currentCard.id, { rating });
    } catch (err) {
      console.error("Failed to submit review:", err);
    }

    if (currentTrainerIndex + 1 < activeDeck.length) {
      setCurrentTrainerIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsTrainerOpen(false);
      fetchFlashcards();
    }
  };

  const handleGenerateFromWeakTopics = async () => {
    setIsGenerating(true);
    try {
      await ApiClient.generateFlashcards({
        subject: selectedSubject === "All" ? "Physics" : selectedSubject,
        topic: "Conservation of Angular Momentum",
        source: "WEAK_TOPICS",
        count: 5,
      });
      fetchFlashcards();
    } catch (err: any) {
      alert(err.message || "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeDeck = dueCards.length > 0 ? dueCards : cards;
  const currentCard = activeDeck[currentTrainerIndex];

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#151515]">
              Smart Flashcards
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Spaced Recall</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Active recall engine connected to your mistake journal, formula vault, and Ebbinghaus retention curve.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleGenerateFromWeakTopics}
            disabled={isGenerating}
            className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold gap-1.5 rounded-xl px-4 py-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFCC42]" />
            {isGenerating ? "Generating..." : "Generate from Weak Topics"}
          </Button>
          <Button
            onClick={handleStartTrainer}
            disabled={activeDeck.length === 0}
            className="bg-[#FF5734] hover:bg-[#E04624] text-white text-xs font-bold gap-1.5 rounded-xl px-5 py-2 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Start Recall Drill ({dueCards.length || cards.length})
          </Button>
        </div>
      </div>

      {/* Spaced Repetition Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#707070] uppercase">DUE TODAY</span>
          <p className="text-xl font-black text-[#BD3012] mt-0.5">{summary.due_today}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#707070] uppercase">NEW</span>
          <p className="text-xl font-black text-[#6C38D4] mt-0.5">{summary.new}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#707070] uppercase">LEARNING</span>
          <p className="text-xl font-black text-[#8F6E00] mt-0.5">{summary.learning}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] text-center shadow-xs">
          <span className="text-[10px] font-bold text-[#707070] uppercase">MASTERED</span>
          <p className="text-xl font-black text-[#047857] mt-0.5">{summary.mastered}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6DE] text-center shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#707070] uppercase">TOTAL DECK</span>
          <p className="text-xl font-black text-[#151515] mt-0.5">{summary.total_cards}</p>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E8E6DE]">
        <div className="flex items-center gap-1.5">
          {["All", "Physics", "Chemistry", "Biology"].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedSubject === subj
                  ? "bg-[#151515] text-white"
                  : "bg-[#FAF9F5] text-[#707070] hover:text-[#151515] border border-[#E8E6DE]"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-[#707070]">
          Showing {cards.length} cards
        </span>
      </div>

      {/* Cards List Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading flashcard decks...</div>
      ) : cards.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E8E6DE] space-y-3">
          <Layers className="h-10 w-10 mx-auto text-[#FF5734]" />
          <h3 className="text-sm font-bold text-[#151515]">No Flashcards in Deck</h3>
          <p className="text-xs text-[#707070] max-w-sm mx-auto">
            Generate flashcards from your uploaded documents, formulas, or recent mistakes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="bg-white border-[#E8E6DE] hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      card.card_type === "FORMULA"
                        ? "bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]"
                        : card.card_type === "MISTAKE"
                        ? "bg-[#FFF0F0] text-[#DC2626] border-[#FECACA]"
                        : "bg-[#F0E9FD] text-[#6C38D4] border-[#E0D1FB]"
                    }
                  >
                    {card.card_type}
                  </Badge>
                  <span className="text-[10px] font-bold text-[#707070]">
                    Stage: {card.retention_state}
                  </span>
                </div>
                <CardTitle className="text-xs font-bold text-[#151515] mt-2 line-clamp-3">
                  <MathRenderer content={card.front} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 border-t border-[#EFEFE8] space-y-2">
                <div className="text-xs text-[#555555] line-clamp-2">
                  <MathRenderer content={card.back} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#707070]">
                  <span>{card.subject} · {card.topic}</span>
                  <span className="font-bold text-[#BD3012]">
                    Interval: {card.interval_days}d
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 3D Flip Card Interactive Drill Modal */}
      {isTrainerOpen && currentCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-xl space-y-4">
            {/* Header progress */}
            <div className="flex items-center justify-between text-white text-xs font-bold px-1">
              <span>Card {currentTrainerIndex + 1} of {activeDeck.length}</span>
              <button onClick={() => setIsTrainerOpen(false)} className="text-white/80 hover:text-white">
                ESC / Close
              </button>
            </div>

            {/* Flashcard Body (3D Flip Simulation) */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-white rounded-3xl p-8 border border-[#E8E6DE] shadow-2xl min-h-[300px] flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">
                  {currentCard.card_type}
                </Badge>
                <span className="text-xs font-bold text-[#707070]">
                  {currentCard.subject} · {currentCard.topic}
                </span>
              </div>

              <div className="my-auto py-6 text-center space-y-3">
                {!isFlipped ? (
                  <div className="space-y-3">
                    <div className="text-lg font-bold text-[#151515] leading-relaxed">
                      <MathRenderer content={currentCard.front} />
                    </div>
                    {currentCard.hint && (
                      <div className="text-xs text-[#8F6E00] italic">
                        Hint: <MathRenderer content={currentCard.hint} />
                      </div>
                    )}
                    <span className="inline-block text-[11px] font-bold text-[#9CA3AF] mt-4">
                      (Click card or press Space to reveal answer)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in-0 duration-200">
                    <div className="p-4 bg-[#FAF9F5] border border-[#E8E6DE] rounded-2xl">
                      <div className="text-base font-semibold text-[#BD3012] leading-relaxed">
                        <MathRenderer content={currentCard.back} />
                      </div>
                    </div>
                    {currentCard.source_reference && (
                      <span className="text-[10px] text-[#707070]">
                        Source: {currentCard.source_reference}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] font-bold text-[#9CA3AF]">
                {isFlipped ? "Rate your memory recall below" : "Active Recall Mode"}
              </div>
            </div>

            {/* SM-2 Review Buttons */}
            {isFlipped && (
              <div className="grid grid-cols-4 gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => handleReviewRating("AGAIN")}
                  className="bg-[#FFF0F0] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-colors"
                >
                  <span>AGAIN</span>
                  <span className="text-[9px] font-medium opacity-80">&lt; 15m</span>
                </button>
                <button
                  onClick={() => handleReviewRating("HARD")}
                  className="bg-[#FFFDF7] hover:bg-[#FEF9C3] text-[#8F6E00] border border-[#FEF08A] py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-colors"
                >
                  <span>HARD</span>
                  <span className="text-[9px] font-medium opacity-80">+ 1d</span>
                </button>
                <button
                  onClick={() => handleReviewRating("GOOD")}
                  className="bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-colors"
                >
                  <span>GOOD</span>
                  <span className="text-[9px] font-medium opacity-80">+ 3d</span>
                </button>
                <button
                  onClick={() => handleReviewRating("EASY")}
                  className="bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center transition-colors"
                >
                  <span>EASY</span>
                  <span className="text-[9px] font-medium opacity-80">+ 7d</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
