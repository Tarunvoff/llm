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
  Check,
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
  { id: "University", name: "University STEM", defaultSubjects: ["Calculus", "Physics", "Computer Science"] },
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
    <div className="min-h-screen bg-[#F7F7F2] text-[#151515] flex flex-col justify-between p-6 sm:p-12">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-[#E8E6DE] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF5734] text-white font-display text-xs font-bold shadow-sm">
            IT
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-[#151515]">
            INTELLITUTOR <span className="text-[#FF5734]">ONBOARDING</span>
          </span>
        </div>
        <Badge variant="yellow" className="text-xs font-bold">
          Step {step} of {totalSteps}
        </Badge>
      </div>

      {/* Main Step Container */}
      <div className="max-w-xl mx-auto w-full py-8">
        {step === 1 && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">About you</h2>
              <p className="text-xs text-[#555555]">
                Let's calibrate your student profile for personalized guidance.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151515]">Your Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151515]">Current Academic Level</label>
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
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">What is your primary goal?</h2>
              <p className="text-xs text-[#555555]">
                IntelliTutor adapts syllabus weighting and question difficulty to your target exam.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => handleExamSelect(exam.id)}
                  className={`p-4 rounded-2xl border-2 text-left text-xs transition-all ${
                    targetExam === exam.id
                      ? "bg-[#FFF3F0] border-[#FF5734] text-[#151515] shadow-subtle font-bold"
                      : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:border-[#151515] hover:bg-white"
                  }`}
                >
                  <p className="font-display font-bold text-sm text-[#151515]">{exam.name}</p>
                  <p className="text-[11px] text-[#707070] mt-1">
                    {exam.defaultSubjects.join(", ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">Confirm your focus subjects</h2>
              <p className="text-xs text-[#555555]">
                Select the subjects you are actively preparing for.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {["Physics", "Chemistry", "Biology", "Mathematics", "General Studies", "Organic Chemistry", "Analytical Reasoning", "Computer Science"].map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    onClick={() => toggleSubject(subj)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#FF5734] border-[#FF5734] text-white shadow-sm"
                        : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:text-[#151515] hover:bg-white"
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
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">Timeline & commitment</h2>
              <p className="text-xs text-[#555555]">
                When is your target exam, and how many hours can you dedicate daily?
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#151515]">Target Exam Date / Period</label>
                <Input
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  placeholder="e.g. May 2027 or in 45 Days"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#151515]">
                  <label>Daily Study Goal</label>
                  <span className="text-[#FF5734] font-bold text-sm">{dailyHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5734]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">Current baseline confidence</h2>
              <p className="text-xs text-[#555555]">
                How would you describe your current conceptual grasp?
              </p>
            </div>
            <div className="space-y-3">
              {[
                { id: "Beginner", label: "Starting Fresh", desc: "Need thorough foundational review and concept clarity before solving difficult questions." },
                { id: "Intermediate", label: "Intermediate", desc: "Familiar with theory; need diagnostic practice and revision of recurring mistake areas." },
                { id: "Advanced", label: "Advanced / Revision Mode", desc: "Rapid mock tests, high-difficulty problems, and time optimization." },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setConfidence(item.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left text-xs transition-all ${
                    confidence === item.id
                      ? "bg-[#F0E9FD] border-[#B99AF5] text-[#151515] shadow-subtle"
                      : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:border-[#151515] hover:bg-white"
                  }`}
                >
                  <p className="font-display font-bold text-sm text-[#151515]">{item.label}</p>
                  <p className="text-xs text-[#707070] mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-[#151515]">How should IntelliTutor explain things?</h2>
              <p className="text-xs text-[#555555]">
                You can change this anytime from the AI Tutor chat screen.
              </p>
            </div>
            <div className="space-y-3">
              {explanationStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setExplanationPref(style.id)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-left text-xs transition-all ${
                    explanationPref === style.id
                      ? "bg-[#FFF9D6] border-[#FFCC42] text-[#151515] shadow-subtle"
                      : "bg-[#FAF9F5] border-[#E8E6DE] text-[#555555] hover:border-[#151515] hover:bg-white"
                  }`}
                >
                  <p className="font-display font-bold text-sm text-[#151515]">{style.label}</p>
                  <p className="text-xs text-[#707070] mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="bg-white border-2 border-[#151515] rounded-3xl p-8 shadow-[6px_6px_0px_0px_#151515] space-y-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
              <Check className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-[#151515]">Your study system is ready.</h2>
              <p className="text-xs text-[#555555] max-w-md mx-auto">
                We've configured your personalized roadmap for <strong>{targetExam}</strong> ({selectedSubjects.join(", ")}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E8E6DE] text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#707070]">Student:</span>
                <span className="font-bold text-[#151515]">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707070]">Target Goal:</span>
                <span className="font-bold text-[#FF5734]">{targetExam} ({targetDate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707070]">Daily Commitment:</span>
                <span className="font-bold text-[#151515]">{dailyHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#707070]">AI Pedagogy:</span>
                <span className="font-bold text-[#6C38D4]">{explanationPref}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-t border-[#E8E6DE] pt-4">
        {step > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
            className="text-xs h-9 font-bold border-[#E4E2D8]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setStep(step + 1)}
            className="text-xs h-9 font-bold"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleFinish}
            className="text-xs h-9 font-bold"
          >
            Launch Study Workspace
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
