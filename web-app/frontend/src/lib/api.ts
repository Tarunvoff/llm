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
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("intellitutor_token");
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

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

  static async completeOnboarding(data: {
    full_name?: string;
    target_exam: string;
    selected_subjects: string[];
    target_exam_date?: string;
    daily_study_hours: number;
    confidence_level: string;
    explanation_preference: string;
  }): Promise<User> {
    return this.request<User>("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getDashboard(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/dashboard");
  }
}
