const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface UserProfile {
  target_exam: string;
  target_exam_date?: string;
  daily_study_hours: number;
  current_grade_level: string;
  selected_subjects: string[];
  confidence_level: string;
  explanation_preference: string;
  onboarding_completed: boolean;
  streak_days: number;
  xp: number;
  total_study_minutes: number;
  accuracy_percentage: number;
  questions_solved: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  profile?: UserProfile;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    onboarding_completed: boolean;
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  pages: number;
  size: string;
  status: string;
  extracted_topics: string[];
  created_at: string;
  last_accessed: string;
}

export interface Citation {
  document_title: string;
  page: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  explanation_mode?: string;
  citations?: Citation[];
  related_topics?: string[];
  recommended_action?: {
    title: string;
    type: string;
  };
  created_at?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardSummary {
  user_name: string;
  target_exam: string;
  streak_days: number;
  xp: number;
  today_progress_percentage: number;
  daily_study_goal_hours: number;
  today_plan: Array<{
    id: string;
    time: string;
    subject: string;
    topic: string;
    duration_min: number;
    activity_type: string;
    is_completed: boolean;
  }>;
  weak_topics: Array<{
    topic: string;
    subject: string;
    mastery_percentage: number;
    mistake_count: number;
  }>;
  revision_due: Array<{
    id: string;
    topic: string;
    subject: string;
    due_text: string;
    interval_stage: number;
  }>;
  ai_recommendation: {
    title: string;
    highlight: string;
    description: string;
    action_text: string;
    topic: string;
  };
  accuracy_percentage: number;
  questions_solved: number;
}

export class ApiClient {
  public static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("intellitutor_token") || localStorage.getItem("access_token");
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP error ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // --- Auth & User ---
  static async register(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  static async completeOnboarding(data: any): Promise<User> {
    return this.request<User>("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateProfile(data: Partial<UserProfile> & { full_name?: string }): Promise<User> {
    return this.request<User>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // --- Dashboard ---
  static async getDashboard(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/dashboard");
  }

  static async toggleTask(taskId: string): Promise<{ status: string; is_completed: boolean }> {
    return this.request<{ status: string; is_completed: boolean }>(`/dashboard/tasks/${taskId}/toggle`, {
      method: "POST",
    });
  }

  // --- Study Library ---
  static async getDocuments(subject?: string): Promise<{ documents: DocumentItem[] }> {
    const query = subject && subject !== "All" ? `?subject=${encodeURIComponent(subject)}` : "";
    return this.request<{ documents: DocumentItem[] }>(`/documents${query}`);
  }

  static async uploadDocument(formData: FormData): Promise<any> {
    return this.request<any>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  static async getDocumentDetails(documentId: string): Promise<any> {
    return this.request<any>(`/documents/${documentId}`);
  }

  static async deleteDocument(documentId: string): Promise<any> {
    return this.request<any>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  // --- AI Tutor & Conversations ---
  static async getConversations(): Promise<{ conversations: ConversationItem[] }> {
    return this.request<{ conversations: ConversationItem[] }>("/tutor/conversations");
  }

  static async createConversation(title: string, subject: string, topic?: string): Promise<ConversationItem> {
    return this.request<ConversationItem>("/tutor/conversations", {
      method: "POST",
      body: JSON.stringify({ title, subject, topic }),
    });
  }

  static async getConversationDetails(conversationId: string): Promise<{
    id: string;
    title: string;
    subject: string;
    topic?: string;
    messages: ChatMessage[];
  }> {
    return this.request<any>(`/tutor/conversations/${conversationId}`);
  }

  static async sendTutorChat(data: {
    conversation_id?: string;
    prompt: string;
    explanation_mode: string;
    subject?: string;
  }): Promise<{ conversation_id: string; message: ChatMessage }> {
    return this.request<any>("/tutor/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async streamTutorChat(
    data: { conversation_id?: string; prompt: string; explanation_mode: string; subject?: string },
    callbacks: {
      onInit?: (data: { conversation_id: string; citations: Citation[] }) => void;
      onChunk?: (chunk: string) => void;
      onDone?: (messageId: string) => void;
      onError?: (err: any) => void;
    }
  ) {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/tutor/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream response body reader unavailable");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              const event = JSON.parse(jsonStr);
              if (event.type === "init" && callbacks.onInit) {
                callbacks.onInit(event);
              } else if (event.type === "chunk" && callbacks.onChunk) {
                callbacks.onChunk(event.content);
              } else if (event.type === "done" && callbacks.onDone) {
                callbacks.onDone(event.message_id);
              }
            }
          }
        }
      }
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
    }
  }

  static async analyzeDiagram(formData: FormData): Promise<{ status: string; analysis: string }> {
    return this.request<{ status: string; analysis: string }>("/tutor/analyze-image", {
      method: "POST",
      body: formData,
    });
  }

  // --- Curriculum Hierarchy ---
  static async getCurriculumExams(): Promise<{ exams: any[] }> {
    return this.request<{ exams: any[] }>("/curriculum/exams");
  }

  static async getCurriculumSubjects(exam: string = "NEET"): Promise<{ exam: string; subjects: any[] }> {
    return this.request<{ exam: string; subjects: any[] }>(`/curriculum/subjects?exam=${encodeURIComponent(exam)}`);
  }

  // --- Phase 5: Practice & Quizzes ---
  static async generateQuiz(data: {
    subject: string;
    chapter?: string;
    topic?: string;
    difficulty: string;
    question_type: string;
    question_count: number;
  }): Promise<any> {
    return this.request<any>("/quizzes/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async submitQuiz(quizId: string, data: { answers: any[]; time_taken_seconds: number }): Promise<any> {
    return this.request<any>(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Phase 5: Mistake Notebook ---
  static async getMistakes(params?: { subject?: string; mistake_type?: string; is_resolved?: boolean }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.subject) query.append("subject", params.subject);
    if (params?.mistake_type) query.append("mistake_type", params.mistake_type);
    if (params?.is_resolved !== undefined) query.append("is_resolved", String(params.is_resolved));
    const qs = query.toString();
    return this.request<any>(`/mistakes${qs ? `?${qs}` : ""}`);
  }

  static async toggleResolveMistake(mistakeId: string): Promise<any> {
    return this.request<any>(`/mistakes/${mistakeId}/toggle-resolve`, {
      method: "POST",
    });
  }

  static async retestMistakes(subject?: string): Promise<any> {
    return this.request<any>("/mistakes/retest", {
      method: "POST",
      body: JSON.stringify({ subject }),
    });
  }

  // --- Phase 6: Spaced Repetition Revision ---
  static async getRevisionSchedule(): Promise<any> {
    return this.request<any>("/revision");
  }

  static async completeRevisionItem(itemId: string): Promise<any> {
    return this.request<any>(`/revision/${itemId}/complete`, {
      method: "POST",
    });
  }

  static async generateRevisionSchedule(): Promise<any> {
    return this.request<any>("/revision/generate", {
      method: "POST",
    });
  }

  // --- Phase 6: Study Planner ---
  static async getWeeklyPlan(): Promise<any> {
    return this.request<any>("/planner/week");
  }

  static async togglePlannerItem(itemId: string): Promise<any> {
    return this.request<any>(`/planner/items/${itemId}/toggle`, {
      method: "POST",
    });
  }

  static async addPlannerItem(data: any): Promise<any> {
    return this.request<any>("/planner/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async reoptimizePlan(): Promise<any> {
    return this.request<any>("/planner/generate", {
      method: "POST",
    });
  }

  // --- Phase 6: Mock Tests ---
  static async getMockTests(): Promise<any> {
    return this.request<any>("/mock-tests");
  }

  static async generateMockTest(data: any): Promise<any> {
    return this.request<any>("/mock-tests/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getMockTest(id: string): Promise<any> {
    return this.request<any>(`/mock-tests/${id}`);
  }

  // --- Phase 6: Analytics ---
  static async getAnalyticsOverview(): Promise<any> {
    return this.request<any>("/analytics/overview");
  }

  static async getMasteryTree(): Promise<any> {
    return this.request<any>("/analytics/mastery-tree");
  }

  // --- Phase 7: Study Goals & Milestones ---
  static async getGoals(): Promise<{ goals: any[] }> {
    return this.request<{ goals: any[] }>("/goals");
  }

  static async createGoal(data: {
    title: string;
    target_metric: string;
    current_metric?: string;
    progress_percentage?: number;
    due_date_str?: string;
    variant?: string;
  }): Promise<any> {
    return this.request<any>("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async toggleGoal(goalId: string): Promise<any> {
    return this.request<any>(`/goals/${goalId}/toggle`, {
      method: "POST",
    });
  }

  static async deleteGoal(goalId: string): Promise<any> {
    return this.request<any>(`/goals/${goalId}`, {
      method: "DELETE",
    });
  }

  // --- Phase 8: Gamification & Achievements ---
  static async getAchievements(): Promise<any> {
    return this.request<any>("/achievements");
  }

  static async claimAchievement(badgeId: string): Promise<any> {
    return this.request<any>(`/achievements/${badgeId}/claim`, {
      method: "POST",
    });
  }

  // --- Phase 9: Settings & Data Export ---
  static async getSettings(): Promise<{ settings: any }> {
    return this.request<{ settings: any }>("/settings");
  }

  static async updateSettings(data: any): Promise<any> {
    return this.request<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async exportUserData(): Promise<any> {
    return this.request<any>("/settings/export-data", {
      method: "POST",
    });
  }

  static async resetHistory(): Promise<any> {
    return this.request<any>("/settings/reset-history", {
      method: "POST",
    });
  }

  // --- Phase 10: Unified Knowledge Hub & Global Search ---
  static async getKnowledgeItems(params?: {
    type?: string;
    subject?: string;
    topic?: string;
    is_pinned?: boolean;
    search?: string;
  }): Promise<{ count: number; items: any[] }> {
    const q = new URLSearchParams();
    if (params?.type) q.append("type", params.type);
    if (params?.subject) q.append("subject", params.subject);
    if (params?.topic) q.append("topic", params.topic);
    if (params?.is_pinned !== undefined) q.append("is_pinned", String(params.is_pinned));
    if (params?.search) q.append("search", params.search);
    const qs = q.toString();
    return this.request<{ count: number; items: any[] }>(`/knowledge${qs ? `?${qs}` : ""}`);
  }

  static async getKnowledgeItem(id: string): Promise<any> {
    return this.request<any>(`/knowledge/${id}`);
  }

  static async createKnowledgeItem(data: any): Promise<any> {
    return this.request<any>("/knowledge", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async extractKnowledge(data: {
    document_id?: string;
    raw_text?: string;
    subject: string;
    chapter?: string;
    topic: string;
  }): Promise<any> {
    return this.request<any>("/knowledge/extract", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async togglePinKnowledge(id: string): Promise<any> {
    return this.request<any>(`/knowledge/${id}/toggle-pin`, {
      method: "PUT",
    });
  }

  static async deleteKnowledgeItem(id: string): Promise<any> {
    return this.request<any>(`/knowledge/${id}`, {
      method: "DELETE",
    });
  }

  static async globalSearch(query: string, subject?: string): Promise<{ query: string; results: any }> {
    return this.request<{ query: string; results: any }>("/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ query, subject }),
    });
  }

  // --- Phase 11: Smart Flashcards & Spaced Recall ---
  static async getFlashcards(params?: {
    subject?: string;
    topic?: string;
    card_type?: string;
    state?: string;
  }): Promise<{ summary: any; cards: any[] }> {
    const q = new URLSearchParams();
    if (params?.subject) q.append("subject", params.subject);
    if (params?.topic) q.append("topic", params.topic);
    if (params?.card_type) q.append("card_type", params.card_type);
    if (params?.state) q.append("state", params.state);
    const qs = q.toString();
    return this.request<{ summary: any; cards: any[] }>(`/flashcards${qs ? `?${qs}` : ""}`);
  }

  static async getDueFlashcards(subject?: string): Promise<{ total_due: number; breakdown: any; cards: any[] }> {
    const q = subject && subject !== "All" ? `?subject=${encodeURIComponent(subject)}` : "";
    return this.request<{ total_due: number; breakdown: any; cards: any[] }>(`/flashcards/due${q}`);
  }

  static async reviewFlashcard(cardId: string, data: { rating: string; time_taken_ms?: number }): Promise<any> {
    return this.request<any>(`/flashcards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateFlashcards(data: {
    subject: string;
    chapter?: string;
    topic: string;
    source: string;
    count: number;
  }): Promise<any> {
    return this.request<any>("/flashcards/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async createFlashcard(data: any): Promise<any> {
    return this.request<any>("/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async deleteFlashcard(cardId: string): Promise<any> {
    return this.request<any>(`/flashcards/${cardId}`, {
      method: "DELETE",
    });
  }

  // --- Phase 12, 20, 21: Formula & Memory Vault, Quick Recall, Exam Cram ---
  static async getMemoryOverview(): Promise<any> {
    return this.request<any>("/memory");
  }

  static async getFormulaVault(subject?: string, topic?: string): Promise<{ grouped_formulas: any; total_formulas: number }> {
    const q = new URLSearchParams();
    if (subject && subject !== "All") q.append("subject", subject);
    if (topic) q.append("topic", topic);
    const qs = q.toString();
    return this.request<{ grouped_formulas: any; total_formulas: number }>(`/memory/formulas${qs ? `?${qs}` : ""}`);
  }

  static async getFactsAndDefinitions(subject?: string, type?: string): Promise<{ count: number; facts: any[] }> {
    const q = new URLSearchParams();
    if (subject && subject !== "All") q.append("subject", subject);
    if (type && type !== "ALL") q.append("type", type);
    const qs = q.toString();
    return this.request<{ count: number; facts: any[] }>(`/memory/facts${qs ? `?${qs}` : ""}`);
  }

  static async getQuickRecallSession(durationMinutes: number = 10, subject?: string): Promise<any> {
    const q = new URLSearchParams({ duration_minutes: String(durationMinutes) });
    if (subject && subject !== "All") q.append("subject", subject);
    return this.request<any>(`/memory/quick-recall?${q.toString()}`);
  }

  static async getExamMemoryCramMode(exam: string = "NEET"): Promise<any> {
    return this.request<any>(`/memory/exam?exam=${encodeURIComponent(exam)}`);
  }

  // --- Phase 13: Educational Diagrams ---
  static async getDiagrams(subject?: string): Promise<{ count: number; diagrams: any[] }> {
    const q = subject && subject !== "All" ? `?subject=${encodeURIComponent(subject)}` : "";
    return this.request<{ count: number; diagrams: any[] }>(`/diagrams${q}`);
  }

  static async getDiagramDetails(diagramId: string): Promise<any> {
    return this.request<any>(`/diagrams/${diagramId}`);
  }

  static async generateDiagram(topic: string, subject: string = "Physics"): Promise<any> {
    return this.request<any>("/diagrams/generate", {
      method: "POST",
      body: JSON.stringify({ topic, subject }),
    });
  }

  // --- Phase 14: PYQ Knowledge System ---
  static async getPYQs(params?: {
    exam?: string;
    year?: number;
    subject?: string;
    topic?: string;
    difficulty?: string;
    status_filter?: string;
  }): Promise<{ count: number; total_available_years: number[]; pyqs: any[] }> {
    const q = new URLSearchParams();
    if (params?.exam) q.append("exam", params.exam);
    if (params?.year) q.append("year", String(params.year));
    if (params?.subject) q.append("subject", params.subject);
    if (params?.topic) q.append("topic", params.topic);
    if (params?.difficulty) q.append("difficulty", params.difficulty);
    if (params?.status_filter) q.append("status_filter", params.status_filter);
    const qs = q.toString();
    return this.request<any>(`/pyq${qs ? `?${qs}` : ""}`);
  }

  static async getPYQDetails(pyqId: string): Promise<any> {
    return this.request<any>(`/pyq/${pyqId}`);
  }

  static async submitPYQAttempt(pyqId: string, data: { selected_option: string; time_taken_seconds?: number }): Promise<any> {
    return this.request<any>(`/pyq/${pyqId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getPYQAnalytics(): Promise<any> {
    return this.request<any>("/pyq/analytics/overview");
  }

  // --- Phase 15: Reference Book System ---
  static async getBooks(subject?: string, sourceType?: string): Promise<{ count: number; books: any[] }> {
    const q = new URLSearchParams();
    if (subject && subject !== "All") q.append("subject", subject);
    if (sourceType && sourceType !== "ALL") q.append("source_type", sourceType);
    const qs = q.toString();
    return this.request<{ count: number; books: any[] }>(`/books${qs ? `?${qs}` : ""}`);
  }

  static async getBookDetails(bookId: string): Promise<any> {
    return this.request<any>(`/books/${bookId}`);
  }

  static async getChapterStudyCenter(bookId: string, chapterId: string): Promise<any> {
    return this.request<any>(`/books/${bookId}/chapters/${chapterId}/study-center`);
  }

  // --- Phase 16, 17, 19: Personalized Videos, Recommender & What to study next ---
  static async getRecommendedVideos(params?: {
    topic?: string;
    subject?: string;
    style?: string;
    duration_category?: string;
  }): Promise<{ target_topic: string; target_subject: string; videos: any[] }> {
    const q = new URLSearchParams();
    if (params?.topic) q.append("topic", params.topic);
    if (params?.subject) q.append("subject", params.subject);
    if (params?.style) q.append("style", params.style);
    if (params?.duration_category) q.append("duration_category", params.duration_category);
    const qs = q.toString();
    return this.request<any>(`/resources/videos${qs ? `?${qs}` : ""}`);
  }

  static async submitVideoFeedback(videoId: string, data: { feedback_rating: string; watch_percentage?: number }): Promise<any> {
    return this.request<any>(`/resources/videos/${videoId}/feedback`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async logVideoInteraction(videoId: string, data: { watch_percentage: number; is_completed?: boolean; is_saved?: boolean; is_liked?: boolean }): Promise<any> {
    return this.request<any>(`/resources/videos/${videoId}/interaction`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getWhatShouldIDoNow(): Promise<{ recommendation: any }> {
    return this.request<{ recommendation: any }>("/resources/next-action");
  }

  static async getRetentionMatrix(): Promise<{ overall_retention_score: number; topics_at_risk_count: number; matrix: any[] }> {
    return this.request<any>("/resources/retention-matrix");
  }

  // --- Phase 18: Unified Topic 360 Center ---
  static async getTopicOverview(topicName: string): Promise<{ overview: any }> {
    return this.request<{ overview: any }>(`/topics/${encodeURIComponent(topicName)}/overview`);
  }
}


