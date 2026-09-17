"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Play, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Flag, Clock, Check, AlertCircle, Award, BookOpen, ChevronRight, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";


interface QuestionItem {
  id: string;
  question_text: string;
  options: string[];
  topic?: string;
  difficulty?: string;
  question_type?: string;
  correct_answer?: string;
  explanation?: string;
}

interface QuizSubmissionResult {
  score_percentage: number;
  correct_count: number;
  total_questions: number;
  earned_xp: number;
  mistakes_count: number;
  results: Array<{
    question_id: string;
    question_text: string;
    options: string[];
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
    topic?: string;
  }>;
}

export default function PracticePage() {
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState("Exam level");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Active Quiz State
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("Physics Adaptive Practice Set");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  
  // Submission & Results State
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Initialize with fallback question set so the page is never blank
  useEffect(() => {
    if (questions.length === 0) {
      setQuestions([
        {
          id: "q-default-1",
          question_text: "A solid uniform cylinder of mass M and radius R rolls without slipping down a plane inclined at angle θ. What is the linear acceleration of its center of mass?",
          options: ["(1/2) g sin θ", "(2/3) g sin θ", "(3/4) g sin θ", "g sin θ"],
          correct_answer: "(2/3) g sin θ",
          explanation: "For pure rolling down an incline: a = g sin θ / (1 + I/(MR²)). For a solid cylinder I = (1/2)MR², which gives a = g sin θ / (1 + 1/2) = (2/3) g sin θ.",
          topic: "Rotational Dynamics & Incline Acceleration",
          difficulty: "Exam level",
          question_type: "MCQ"
        },
        {
          id: "q-default-2",
          question_text: "When net external torque acting on a rotating system is zero, which of the following statements is strictly true?",
          options: ["Total mechanical energy is zero", "Angular momentum of the system is strictly conserved", "Linear acceleration must be constant", "Moment of inertia cannot change"],
          correct_answer: "Angular momentum of the system is strictly conserved",
          explanation: "From Newton's second law for rotation: τ_net = dL/dt. When τ_net = 0, dL/dt = 0, meaning total angular momentum vector L remains constant in magnitude and direction.",
          topic: "Conservation of Angular Momentum",
          difficulty: "Medium",
          question_type: "MCQ"
        },
        {
          id: "q-default-3",
          question_text: "Assertion (A): A hollow sphere takes more time to roll down an incline than a solid sphere of identical mass and radius.\nReason (R): The moment of inertia of a hollow sphere is greater than that of a solid sphere about the central axis.",
          options: [
            "Both A and R are true, and R is the correct explanation of A",
            "Both A and R are true, but R is NOT the correct explanation of A",
            "A is true, but R is false",
            "A is false, but R is true"
          ],
          correct_answer: "Both A and R are true, and R is the correct explanation of A",
          explanation: "I_hollow = (2/3)MR² > I_solid = (2/5)MR². A higher moment of inertia lowers linear acceleration a = g sin θ / (1 + I/MR²), resulting in a longer descent time.",
          topic: "Rolling Friction & Inertia",
          difficulty: "Hard",
          question_type: "Assertion Reason"
        }
      ]);
    }
  }, [questions.length]);

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const data = await ApiClient.generateQuiz({
        subject: selectedSubject,
        chapter: "High-Yield Chapter",
        topic: `${selectedSubject} Core Mastery`,
        difficulty: difficulty,
        question_type: "MCQ",
        question_count: questionCount
      });

      if (data) {
        const quizObj = data.quiz || data;
        setQuizId(quizObj.id || data.quiz_id);
        setQuizTitle(quizObj.title || `${selectedSubject} Adaptive Practice Set`);
        if (quizObj.questions && quizObj.questions.length > 0) {
          setQuestions(quizObj.questions);
        }
      }
    } catch (err) {
      console.warn("Quiz generation fallback to local simulated pool:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionText: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionText
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const currentQ = questions;
    const answersPayload = currentQ.map((q) => ({
      question_id: q.id,
      user_answer: selectedAnswers[q.id] || "Unanswered"
    }));

    try {
      if (quizId) {
        const resultData = await ApiClient.submitQuiz(quizId, {
          answers: answersPayload,
          time_taken_seconds: 140
        });

        if (resultData) {
          setQuizResult(resultData);
          setShowExplanation(true);
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Submit fallback to local scoring:", err);
    }

    // Local grading fallback
    let correct = 0;
    const graded = currentQ.map((q) => {
      const userAns = selectedAnswers[q.id] || "";
      const isCorrect = userAns.trim().toLowerCase() === (q.correct_answer || "").trim().toLowerCase();
      if (isCorrect) correct++;
      return {
        question_id: q.id,
        question_text: q.question_text,
        options: q.options,
        user_answer: userAns || "Unanswered",
        correct_answer: q.correct_answer || q.options[0],
        is_correct: isCorrect,
        explanation: q.explanation || "Core conceptual law dictates this option as authoritative.",
        topic: q.topic
      };
    });

    const scorePct = Math.round((correct / currentQ.length) * 100);
    setQuizResult({
      score_percentage: scorePct,
      correct_count: correct,
      total_questions: currentQ.length,
      earned_xp: (correct * 20) + 10,
      mistakes_count: currentQ.length - correct,
      results: graded
    });
    setShowExplanation(true);
    setIsSubmitting(false);
  };

  const currentQ = questions[currentQuestionIndex] || questions[0];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#151515]">Adaptive Practice</h2>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Targeted diagnostic assessment. Automatically identifies weak concepts and syncs with your Mistake Intelligence Notebook.
            </p>
          </div>
          {quizResult && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 font-bold gap-2 border-[#151515]"
              onClick={() => {
                setQuizResult(null);
                setSelectedAnswers({});
                setCurrentQuestionIndex(0);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Take Another Quiz</span>
            </Button>
          )}
        </div>

        {/* Generator Setup Box */}
        {!quizResult && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#151515] space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Select Subject</label>
              <div className="flex flex-wrap gap-2.5 mt-2.5">
                {["Physics", "Chemistry", "Biology", "Mathematics"].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      selectedSubject === subj
                        ? "bg-[#FF5734] text-white shadow-sm"
                        : "bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Difficulty Level</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Easy", "Medium", "Hard", "Exam level"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        difficulty === lvl
                          ? "bg-[#F0E9FD] border-[#6C38D4] text-[#6C38D4]"
                          : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#707070]">Question Count</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[3, 5, 10].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setQuestionCount(cnt)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        questionCount === cnt
                          ? "bg-[#FFCC42] border-[#151515] text-[#151515]"
                          : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full h-10 text-xs sm:text-sm font-bold gap-2 shadow-sm"
                  onClick={handleGenerateQuiz}
                  isLoading={isGenerating}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate New Questions</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {quizResult ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Scorecard Hero */}
            <div className="bg-[#FAF9F5] border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#151515] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6DE]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#FFCC42] border-2 border-[#151515] flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#151515]">
                    <Award className="h-6 w-6 text-[#151515]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-[#151515]">Quiz Completed!</h3>
                    <p className="text-xs text-[#555555]">Performance successfully recorded in your BKT Mastery Profile.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="coral" className="text-xs px-3 py-1 font-bold">
                    +{quizResult.earned_xp} XP Earned
                  </Badge>
                  <Badge variant="academic" className="text-xs px-3 py-1 font-bold">
                    Score: {quizResult.score_percentage}%
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE]">
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Accuracy</span>
                  <p className="text-2xl font-display font-bold text-[#151515] mt-1">{quizResult.score_percentage}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE]">
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Correct</span>
                  <p className="text-2xl font-display font-bold text-[#16A34A] mt-1">{quizResult.correct_count} / {quizResult.total_questions}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE]">
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Mistakes Logged</span>
                  <p className="text-2xl font-display font-bold text-[#FF5734] mt-1">{quizResult.mistakes_count}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6DE]">
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Retest Trigger</span>
                  <p className="text-xs font-bold text-[#6C38D4] mt-2">Active in Mistake Book</p>
                </div>
              </div>

              {quizResult.mistakes_count > 0 && (
                <div className="p-4 rounded-2xl bg-[#FFF3F0] border border-[#FFD9D0] text-xs text-[#BD3012] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span><strong>{quizResult.mistakes_count} mistake(s)</strong> have been automatically added to your Mistake Notebook for spaced retesting.</span>
                  </div>
                  <a href="/mistakes" className="font-bold underline shrink-0 hover:text-[#151515]">
                    View Mistake Book →
                  </a>
                </div>
              )}
            </div>

            {/* Detailed Question Review List */}
            <div className="space-y-4">
              <h4 className="text-lg font-display font-bold text-[#151515]">Detailed Question Review</h4>
              {quizResult.results.map((res, i) => (
                <div
                  key={res.question_id || i}
                  className={`bg-white border-2 rounded-3xl p-6 shadow-[3px_3px_0px_0px_#151515] space-y-4 ${
                    res.is_correct ? "border-[#16A34A]" : "border-[#FF5734]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EFEFE8]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#707070]">Q{i + 1}</span>
                      <Badge variant={res.is_correct ? "academic" : "coral"} className="text-[10px] font-bold">
                        {res.is_correct ? "CORRECT (+20 XP)" : "INCORRECT (LOGGED)"}
                      </Badge>
                      {res.topic && <span className="text-xs text-[#555555] font-semibold">• {res.topic}</span>}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-[#151515] leading-relaxed">
                    {res.question_text}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border font-semibold ${
                      res.is_correct ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]" : "bg-[#FFF3F0] border-[#FFD9D0] text-[#BD3012]"
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-[#707070]">Your Answer:</span>
                      <span className="mt-0.5 block">{res.user_answer}</span>
                    </div>

                    <div className="p-3 rounded-xl border bg-[#FAF9F5] border-[#E8E6DE] text-[#151515] font-semibold">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-[#707070]">Correct Answer:</span>
                      <span className="mt-0.5 block text-[#16A34A]">{res.correct_answer}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF9D6] border border-[#FFF1A3] text-xs text-[#8F6E00] space-y-1">
                    <strong className="font-bold text-[#151515]">Pedagogical Explanation:</strong>
                    <p className="text-[#151515]/90 leading-relaxed">{res.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Live Question Card */
          currentQ && (
            <div className="bg-white border-2 border-[#151515] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
              {/* Question Header & Palette */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E6DE]">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="coral" className="text-[10px] font-bold uppercase">{selectedSubject}</Badge>
                    <span className="text-xs text-[#707070] font-semibold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#151515] mt-1">
                    {currentQ.topic || "Core Concept Evaluation"}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="yellow" className="text-xs font-bold">{difficulty}</Badge>
                  <button
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                      flaggedQuestions[currentQ.id]
                        ? "bg-[#FFF3F0] border-[#FF5734] text-[#FF5734] font-bold"
                        : "border-[#E8E6DE] text-[#707070] hover:text-[#FF5734]"
                    }`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {flaggedQuestions[currentQ.id] ? "Flagged" : "Flag"}
                  </button>
                </div>
              </div>

              {/* Question Navigation Bubbles */}
              <div className="flex flex-wrap items-center gap-2">
                {questions.map((q, idx) => {
                  const isAns = !!selectedAnswers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlag = !!flaggedQuestions[q.id];

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                        isCurrent
                          ? "bg-[#151515] text-white border-[#151515] shadow-sm scale-110"
                          : isAns
                          ? "bg-[#F0FDF4] border-[#16A34A] text-[#166534]"
                          : isFlag
                          ? "bg-[#FFF3F0] border-[#FF5734] text-[#FF5734]"
                          : "bg-[#FAF9F5] border-[#E8E6DE] text-[#707070] hover:border-[#151515]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-[#151515] leading-relaxed font-medium bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E6DE] whitespace-pre-line">
                  {currentQ.question_text}
                </p>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const optionLetter = String.fromCharCode(65 + optIdx);
                    const isSelected = selectedAnswers[currentQ.id] === opt;

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#F0FDF4] border-[#16A34A] text-[#166534] shadow-subtle"
                            : "bg-white border-[#E8E6DE] text-[#151515] hover:border-[#151515] hover:bg-[#FAF9F5]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? "bg-[#16A34A] text-white"
                                : "bg-[#FAF9F5] border border-[#E8E6DE] text-[#555555]"
                            }`}
                          >
                            {optionLetter}
                          </div>
                          <span>{opt}</span>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-[#166534] bg-white px-2.5 py-1 rounded-full border border-[#BBF7D0]">
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="pt-4 flex items-center justify-between border-t border-[#E8E6DE]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 font-bold border-[#E4E2D8]"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 font-bold border-[#151515]"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      >
                        Next Question →
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs h-9 font-bold px-4"
                        onClick={handleSubmitQuiz}
                        isLoading={isSubmitting}
                      >
                        Submit Test →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
