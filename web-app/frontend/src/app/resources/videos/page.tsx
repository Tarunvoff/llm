"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Film,
  Play,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [targetTopic, setTargetTopic] = useState("");
  const [targetSubject, setTargetSubject] = useState("Physics");
  const [selectedStyle, setSelectedStyle] = useState("Visual");
  const [selectedDuration, setSelectedDuration] = useState<string>("ALL");
  const [feedbackSuccessId, setFeedbackSuccessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getRecommendedVideos({
        style: selectedStyle,
        duration_category: selectedDuration === "ALL" ? undefined : selectedDuration,
      });
      setVideos(res.videos);
      setTargetTopic(res.target_topic);
      setTargetSubject(res.target_subject);
    } catch (err) {
      console.error("Failed to load recommended videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedStyle, selectedDuration]);

  const handleFeedback = async (videoId: string, rating: string) => {
    try {
      await ApiClient.submitVideoFeedback(videoId, { feedback_rating: rating });
      setFeedbackSuccessId(videoId);
      setTimeout(() => setFeedbackSuccessId(null), 2000);
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
              Personalized Video Recommender
            </h1>
            <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC]">Curated</Badge>
          </div>
          <p className="text-xs text-[#707070] mt-1">
            Targeted video lectures selected specifically to resolve your conceptual mistakes and low mastery areas in {targetTopic}.
          </p>
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E6DE]">
          {["Visual", "Conceptual", "Problem solving", "Exam-oriented"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStyle(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStyle === st
                  ? "bg-[#151515] text-white"
                  : "text-[#707070] hover:text-[#151515]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Target Topic Callout */}
      <div className="p-4 bg-[#FFFDF7] border border-[#FFF1A3] rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#FFF9D6] text-[#8F6E00] flex items-center justify-center font-bold shrink-0">
            <Sparkles className="h-5 w-5 fill-[#FFCC42]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F6E00]">
              WHY THESE VIDEOS WERE SELECTED
            </span>
            <p className="text-xs font-bold text-[#151515]">
              You have 3 recorded mistakes in {targetTopic}. These curated videos directly address those question traps.
            </p>
          </div>
        </div>
        <Link href={`/topics/${encodeURIComponent(targetTopic)}`}>
          <Button className="bg-[#151515] hover:bg-[#252525] text-white text-xs font-bold rounded-xl px-4 py-1.5">
            Topic Center
          </Button>
        </Link>
      </div>

      {/* Videos List Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#707070]">Loading recommended videos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((v) => (
            <Card key={v.id} className="bg-white border-[#E8E6DE] overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Video Banner / Thumbnail */}
                <div className="relative h-44 w-full bg-[#151515] overflow-hidden group">
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center justify-between w-full text-white">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5 text-[#FF5734]" /> {v.channel}
                      </span>
                      <span className="text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {v.duration_minutes}m
                      </span>
                    </div>
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[#FFF3F0] text-[#BD3012] border-[#FFC8BC] text-[9px]">{v.style}</Badge>
                    <Badge className="bg-[#FAF9F5] text-[#707070] border-[#E8E6DE] text-[9px]">{v.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-[#151515] leading-snug">
                    {v.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <p className="text-xs text-[#555555] leading-relaxed">
                    {v.why_recommended}
                  </p>
                </CardContent>
              </div>

              {/* Feedback Footer */}
              <div className="p-4 pt-2 border-t border-[#EFEFE8] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-[#707070]">
                  <span>Useful?</span>
                  <button
                    onClick={() => handleFeedback(v.id, "Useful")}
                    className="p-1.5 rounded-lg hover:bg-[#F0FDF4] hover:text-[#16A34A] transition-colors"
                    title="Helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(v.id, "Didnt help")}
                    className="p-1.5 rounded-lg hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  {feedbackSuccessId === v.id && (
                    <span className="text-[10px] font-bold text-[#10B981]">Saved!</span>
                  )}
                </div>

                <a
                  href={v.video_id_or_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-[#FF5734] hover:bg-[#E04624] text-white text-xs font-bold gap-1 rounded-xl px-4 py-1.5 shadow-xs">
                    <Play className="h-3 w-3 fill-white" /> Watch Lecture
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
