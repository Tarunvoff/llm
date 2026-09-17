"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ApiClient, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("intellitutor_token") : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const userData = await ApiClient.getMe();
      setUser(userData);
    } catch (err) {
      console.error("Failed to load user:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("intellitutor_token");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login({ email, password });
      localStorage.setItem("intellitutor_token", res.access_token);
      const userData = await ApiClient.getMe();
      setUser(userData);
      
      if (userData.profile && !userData.profile.onboarding_completed) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    await login("student@intellitutor.ai", "password123");
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.register({ email, password, full_name: fullName });
      localStorage.setItem("intellitutor_token", res.access_token);
      const userData = await ApiClient.getMe();
      setUser(userData);
      router.push("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: any) => {
    setIsLoading(true);
    try {
      const updatedUser = await ApiClient.completeOnboarding(data);
      setUser(updatedUser);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("intellitutor_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
