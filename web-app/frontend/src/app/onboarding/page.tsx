"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const exams = [
  { id: "NEET", name: "NEET (Medical)", defaultSubjects: ["Physics", "Chemistry", "Biology"] },
  { id: "JEE", name: "JEE (Engineering)", defaultSubjects: ["Physics", "Chemistry", "Mathematics"] },
  { id: "UPSC", name: "UPSC / Civil Services", defaultSubjects: ["General Studies", "Polity", "History", "Economy"] },
  { id: "GATE", name: "GATE", defaultSubjects: ["Engineering Mathematics", "Core Technical", "Aptitude"] },
  { id: "CAT", name: "CAT (Management)", defaultSubjects: ["Quantitative Aptitude", "DILR", "VARC"] },
  { id: "University", name: "University / College STEM", defaultSubjects: ["Calculus", "Physics", "Computer Science"] },
  { id: "Other", name: "Other Standardized Exam", defaultSubjects: ["General Science", "Logic", "Language"] },
];

const explanationStyles = [
  { id: "Exam-oriented", label: "Exam-Oriented", desc: "Crisp formulas, common traps, shortcuts, and direct marking rubrics." },
  { id: "Intermediate", label: "Structured & Balanced", desc: "Concept derivation, step-by-step logic, and standard problem examples." },
  { id: "Beginner", label: "Beginner Friendly", desc: "Intuitive analogies, simplified terminology, and foundational intuition." },
  { id: "Child", label: "Explain Like I'm 10", desc: "Extreme clarity, daily life metaphors, and absolute simplicity." },
  { id: "Expert", label: "Rigorous & Advanced", desc: "First-principles mathematical rigor and deep boundary conditions." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || "Aarav Sharma");
  const [gradeLevel, setGradeLevel] = useState("Class 12 / Aspirant");
  const [targetExam, setTargetExam] = useState("NEET");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Physics", "Chemistry", "Biology"]);
  const [targetDate, setTargetDate] = useState("May 2027");
  const [dailyHours, setDailyHours] = useState(3.5);
  const [confidence, setConfidence] = useState("Intermediate");
  const [explanationPref, setExplanationPref] = useState("Exam-oriented");

  const handleExamSelect = (examId: string) => {
    setTargetExam(examId);
    const match = exams.find((e) => e.id === examId);
    if (match) {
      setSelectedSubjects(match.defaultSubjects);
    }
  };

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding({
      full_name: fullName,
      target_exam: targetExam,
      selected_subjects: selectedSubjects,
      target_exam_date: targetDate,
      daily_study_hours: dailyHours,
      confidence_level: confidence,
      explanation_preference: explanationPref,
    });
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex flex-col justify-between p-6 sm:p-12">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-ink-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-academic-700 text-white font-mono text-xs font-bold">
            IT
          </div>
          <span className="font-semibold text-xs uppercase tracking-wider text-ink-100">
            IntelliTutor Onboarding
          </span>
        </div>
        <span className="text-xs font-mono text-academic-400">
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Main Step Container */}
      <div className="max-w-xl mx-auto w-full py-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">About you</h2>
              <p className="text-xs text-ink-400">
                Let's calibrate your student profile for personalized guidance.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-300">Your Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-300">Current Academic Level</label>
                <Input
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. Class 12 / Aspirant / 2nd Year College"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">What is your primary goal?</h2>
              <p className="text-xs text-ink-400">
                IntelliTutor adapts syllabus weighting and question rigor to your target exam.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => handleExamSelect(exam.id)}
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${
                    targetExam === exam.id
                      ? "bg-academic-950/60 border-academic-600 text-ink-100 ring-1 ring-academic-600"
                      : "bg-ink-900/60 border-ink-800 text-ink-300 hover:border-ink-700"
                  }`}
                >
                  <p className="font-semibold">{exam.name}</p>
                  <p className="text-[10px] text-ink-500 font-mono mt-0.5">
                    {exam.defaultSubjects.join(", ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">Confirm your focus subjects</h2>
              <p className="text-xs text-ink-400">
                Select the subjects you are actively preparing for.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Physics", "Chemistry", "Biology", "Mathematics", "General Studies", "Organic Chemistry", "Analytical Reasoning", "Computer Science"].map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    onClick={() => toggleSubject(subj)}
                    className={`px-3.5 py-2 rounded-md border text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-academic-950 border-academic-600 text-academic-300 ring-1 ring-academic-600"
                        : "bg-ink-900 border-ink-800 text-ink-400 hover:text-ink-200"
                    }`}
                  >
                    {subj} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">Timeline & commitment</h2>
              <p className="text-xs text-ink-400">
                When is your target exam, and how many hours can you dedicate daily?
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-300">Target Exam Date / Period</label>
                <Input
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  placeholder="e.g. May 2027 or in 45 Days"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-ink-300">Daily Study Goal</label>
                  <span className="font-mono text-academic-400 font-semibold">{dailyHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-academic-500 bg-ink-800"
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">Current baseline confidence</h2>
              <p className="text-xs text-ink-400">
                How would you describe your current conceptual grasp?
              </p>
            </div>
            <div className="space-y-2.5">
              {[
                { id: "Beginner", label: "Starting Fresh", desc: "Need thorough foundational review and concept clarity before solving difficult questions." },
                { id: "Intermediate", label: "Intermediate", desc: "Familiar with theory; need diagnostic practice and revision of recurring mistake areas." },
                { id: "Advanced", label: "Advanced / Revision Mode", desc: "Rapid mock tests, high-difficulty problems, and time optimization." },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setConfidence(item.id)}
                  className={`w-full p-3.5 rounded-lg border text-left text-xs transition-all ${
                    confidence === item.id
                      ? "bg-academic-950/60 border-academic-600 text-ink-100 ring-1 ring-academic-600"
                      : "bg-ink-900/60 border-ink-800 text-ink-300 hover:border-ink-700"
                  }`}
                >
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-ink-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-ink-50">How should IntelliTutor explain things?</h2>
              <p className="text-xs text-ink-400">
                You can change this anytime from the AI Tutor chat screen.
              </p>
            </div>
            <div className="space-y-2.5">
              {explanationStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setExplanationPref(style.id)}
                  className={`w-full p-3 rounded-lg border text-left text-xs transition-all ${
                    explanationPref === style.id
                      ? "bg-academic-950/60 border-academic-600 text-ink-100 ring-1 ring-academic-600"
                      : "bg-ink-900/60 border-ink-800 text-ink-300 hover:border-ink-700"
                  }`}
                >
                  <p className="font-semibold">{style.label}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-academic-900/80 text-academic-300 ring-1 ring-academic-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-ink-50">Your study system is ready.</h2>
              <p className="text-xs text-ink-400 max-w-md mx-auto">
                We've configured your personalized 45-day roadmap for <strong>{targetExam}</strong> ({selectedSubjects.join(", ")}).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-ink-900 border border-ink-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-500">Student:</span>
                <span className="text-ink-200">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Target Goal:</span>
                <span className="text-academic-400">{targetExam} ({targetDate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Daily Commitment:</span>
                <span className="text-ink-200">{dailyHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">AI Pedagogy:</span>
                <span className="text-ink-200">{explanationPref}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-t border-ink-800/80 pt-4">
        {step > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
            className="text-xs h-8 border-ink-700"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <Button
            variant="academic"
            size="sm"
            onClick={() => setStep(step + 1)}
            className="text-xs h-8"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        ) : (
          <Button
            variant="academic"
            size="sm"
            isLoading={isLoading}
            onClick={handleFinish}
            className="text-xs h-8 font-semibold"
          >
            Launch Study Workspace
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
