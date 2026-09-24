"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role?: string;
  createdAt: string;
  lastLoginAt?: string;
  downloadCount: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  trackDownload: (assetType: string, fileName: string, version: string) => Promise<boolean>;
  // Modal control for gated downloads
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: "login" | "register";
  setAuthModalMode: (mode: "login" | "register") => void;
  authIntentText: string;
  setAuthIntentText: (text: string) => void;
  pendingDownloadAction: (() => void) | null;
  setPendingDownloadAction: (action: (() => void) | null) => void;
  requireAuth: (action: () => void, intentReason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states for intercepting downloads
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("register");
  const [authIntentText, setAuthIntentText] = useState(
    "Please create a free surveyor account or sign in to download Excel to KML Pro."
  );
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);

  // Check current session from backend API on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Session check error", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password = "password123"): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setAuthModalOpen(false);

      // Execute queued download action if any
      if (pendingDownloadAction) {
        setTimeout(() => {
          pendingDownloadAction();
          setPendingDownloadAction(null);
        }, 150);
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Registration failed");
      }

      setUser(resData.user);
      setAuthModalOpen(false);

      // Execute queued download action if any
      if (pendingDownloadAction) {
        setTimeout(() => {
          pendingDownloadAction();
          setPendingDownloadAction(null);
        }, 150);
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  const trackDownload = async (
    assetType: string,
    fileName: string,
    version: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/downloads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetType, fileName, version }),
      });
      if (res.ok) {
        if (user) {
          setUser({ ...user, downloadCount: (user.downloadCount || 0) + 1 });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Guard function for downloads
  const requireAuth = (action: () => void, intentReason?: string) => {
    if (user) {
      action();
    } else {
      setAuthIntentText(
        intentReason ||
          "Registration required: Please create a free surveyor account or sign in to download Excel to KML Pro."
      );
      setPendingDownloadAction(() => action);
      setAuthModalMode("register");
      setAuthModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        trackDownload,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        authIntentText,
        setAuthIntentText,
        pendingDownloadAction,
        setPendingDownloadAction,
        requireAuth,
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
