"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Zap, 
  Flame, 
  Award, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Gift,
  Check,
  AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ApiClient } from "@/lib/api";

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  unlocked: boolean;
  claimed: boolean;
  progress_current: number;
  progress_target: number;
  progress_percentage: number;
  category: string;
  theme: {
    bg: string;
    border: string;
    text: string;
  };
}

interface AchievementsResponse {
  total_xp: number;
  level: number;
  unlocked_count: number;
  total_count: number;
  badges: AchievementBadge[];
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getAchievements();
      setData(res);
    } catch (err: any) {
      console.error("Failed to fetch achievements:", err);
      setError("Unable to load academic achievements. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleClaim = async (badgeId: string) => {
    try {
      setClaimingId(badgeId);
      const res = await ApiClient.claimAchievement(badgeId);
      
      // Update local state with new XP and badge status
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_xp: res.total_xp,
          badges: prev.badges.map(b => b.id === badgeId ? { ...b, claimed: true } : b)
        };
      });

      setCelebrationMsg(`Claimed +${res.claimed_xp} XP! Total XP: ${res.total_xp}`);
      setTimeout(() => setCelebrationMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to claim reward:", err);
      alert("Reward claim failed: " + (err.message || "Unknown error"));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515] flex items-center gap-2">
              <Trophy className="h-7 w-7 text-[#FF5734]" />
              Academic Badges & Mastery
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Celebration layer recognizing consistent study discipline, active recall, and rigorous problem-solving.
            </p>
          </div>
        </div>

        {/* Level & XP Overview */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFF9D6] border-2 border-[#151515] rounded-2xl p-5 shadow-[3px_3px_0px_0px_#151515] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F6E00]">Mastery Level</span>
                <h3 className="text-2xl font-display font-bold text-[#151515] mt-0.5">Level {data.level} Scholar</h3>
                <p className="text-xs text-[#8F6E00] mt-1 font-medium">Rank tier based on cumulative XP</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white border-2 border-[#151515] flex items-center justify-center text-[#8F6E00] shadow-[2px_2px_0px_0px_#151515]">
                <Award className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-[#FFF3F0] border-2 border-[#151515] rounded-2xl p-5 shadow-[3px_3px_0px_0px_#151515] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#BD3012]">Total Earned XP</span>
                <h3 className="text-2xl font-display font-bold text-[#FF5734] mt-0.5">{data.total_xp.toLocaleString()} XP</h3>
                <p className="text-xs text-[#BD3012] mt-1 font-medium">Earned through questions & review</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white border-2 border-[#151515] flex items-center justify-center text-[#FF5734] shadow-[2px_2px_0px_0px_#151515]">
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-[#F0E9FD] border-2 border-[#151515] rounded-2xl p-5 shadow-[3px_3px_0px_0px_#151515] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C38D4]">Badges Unlocked</span>
                <h3 className="text-2xl font-display font-bold text-[#6C38D4] mt-0.5">
                  {data.unlocked_count} / {data.total_count}
                </h3>
                <p className="text-xs text-[#6C38D4] mt-1 font-medium">
                  {Math.round((data.unlocked_count / data.total_count) * 100)}% Milestone Completion
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white border-2 border-[#151515] flex items-center justify-center text-[#6C38D4] shadow-[2px_2px_0px_0px_#151515]">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}

        {/* Celebration Toast */}
        {celebrationMsg && (
          <div className="bg-[#E8F8F0] border-2 border-[#1E7E34] text-[#1E7E34] rounded-2xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_0px_#1E7E34] animate-in fade-in">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-[#1E7E34]" />
            <p className="text-xs font-bold">{celebrationMsg}</p>
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center text-sm text-[#707070] font-medium">
            Evaluating academic achievements and mastery tiers...
          </div>
        )}

        {error && (
          <div className="bg-[#FFF3F0] border-2 border-[#FF5734] rounded-2xl p-4 text-[#BD3012] flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Badges Grid */}
        {!loading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.badges.map((b) => {
              const canClaim = b.unlocked && !b.claimed;

              return (
                <div
                  key={b.id}
                  className={`border-2 border-[#151515] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#151515] space-y-4 flex flex-col justify-between transition-all ${
                    b.unlocked
                      ? "bg-white hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#151515]"
                      : "bg-[#FAF9F5] opacity-65"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Icon & XP Tag */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-[#151515] ${b.theme.bg} ${b.theme.text} shadow-[2px_2px_0px_0px_#151515]`}
                      >
                        {b.unlocked ? <Trophy className="h-6 w-6" /> : <Lock className="h-5 w-5 text-[#999999]" />}
                      </div>
                      <Badge 
                        variant={b.unlocked ? "coral" : "neutral"} 
                        className="text-xs font-bold"
                      >
                        +{b.xp_reward} XP
                      </Badge>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="font-display font-bold text-base text-[#151515] flex items-center gap-1.5">
                        {b.title}
                        {b.claimed && <Check className="h-4 w-4 text-[#1E7E34]" />}
                      </h3>
                      <p className="text-xs text-[#555555] mt-1 leading-relaxed font-medium">
                        {b.description}
                      </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-[#707070]">
                        <span>Progress</span>
                        <span>{b.progress_current} / {b.progress_target}</span>
                      </div>
                      <Progress value={b.progress_percentage} />
                    </div>
                  </div>

                  {/* Actions / Status footer */}
                  <div className="pt-3 border-t border-[#EFEFE8]">
                    {b.claimed ? (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#1E7E34] bg-[#E8F8F0] rounded-xl border border-[#A3E2B8]">
                        <CheckCircle2 className="h-4 w-4" />
                        Reward Claimed
                      </div>
                    ) : canClaim ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleClaim(b.id)}
                        disabled={claimingId === b.id}
                        className="w-full text-xs font-bold h-9 shadow-sm flex items-center justify-center gap-1.5 animate-bounce"
                      >
                        <Gift className="h-4 w-4" />
                        {claimingId === b.id ? "Claiming..." : `Claim +${b.xp_reward} XP`}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#707070] bg-[#EFEFE8] rounded-xl">
                        <Lock className="h-3.5 w-3.5" />
                        Locked ({b.progress_percentage}%)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
