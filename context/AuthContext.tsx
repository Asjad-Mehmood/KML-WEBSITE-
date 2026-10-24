"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePublicSettings } from "@/lib/publicSettings";
import { isAdminUser } from "@/lib/adminRole";

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
  login: (email: string, password: string) => Promise<AuthResult>;
  /** Set while a sign-in waits for an emailed code: an admin's sign-in code, or a new account confirming its email */
  otp: OtpState | null;
  verifyOtp: (code: string, trust: boolean) => Promise<AuthResult>;
  resendOtp: () => Promise<{ ok: true; sentTo: string } | { ok: false; error: string }>;
  cancelOtp: () => void;
  register: (data: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
  }) => Promise<AuthResult>;
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

/** ok, or the reason to show the visitor (from the server when it gave one) */
export type AuthResult = { ok: true; isAdmin?: boolean } | { ok: false; error: string; otpRequired?: boolean };

export interface OtpState {
  /** admin: the admin sign-in code; email: confirming the email of an account */
  kind: "admin" | "email";
  challenge: string;
  sentTo: string;
}

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states for intercepting downloads
  const publicSettings = usePublicSettings();
  const [otp, setOtp] = useState<OtpState | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("register");
  const [authIntentText, setAuthIntentText] = useState(
    "Sign in or create a free account to download the Windows app."
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

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      // The account's email isn't confirmed yet: a code was emailed
      if (data.verifyRequired && data.challenge) {
        setOtp({ kind: "email", challenge: data.challenge, sentTo: data.sentTo });
        return { ok: false, error: "", otpRequired: true };
      }
      if (!res.ok) {
        return { ok: false, error: data.error || "Sign-in failed. Please try again." };
      }
      // Admin from a browser we don't know yet: a code was emailed
      if (data.otpRequired) {
        setOtp({ kind: "admin", challenge: data.challenge, sentTo: data.sentTo });
        return { ok: false, error: "", otpRequired: true };
      }

      return finishSignIn(data.user);
    } catch (err) {
      console.error(err);
      return { ok: false, error: NETWORK_ERROR };
    }
  };

  const finishSignIn = (signedIn: User): AuthResult => {
    setUser(signedIn);
    setAuthModalOpen(false);
    setOtp(null);

    // Execute queued download action if any
    if (pendingDownloadAction) {
      setTimeout(() => {
        pendingDownloadAction();
        setPendingDownloadAction(null);
      }, 150);
    }

    return { ok: true, isAdmin: isAdminUser(signedIn) };
  };

  const verifyOtp = async (code: string, trust: boolean): Promise<AuthResult> => {
    if (!otp) return { ok: false, error: "Start again from the sign-in page." };
    try {
      const res = await fetch(otp.kind === "email" ? "/api/auth/verify-email" : "/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: otp.challenge, code, trust }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // an expired or used-up admin code can't be retried: back to the password step
        // (an email confirmation stays on the code step, where a new code can be sent)
        if (data.restart) setOtp(null);
        return { ok: false, error: data.error || "That code didn't work. Please try again." };
      }
      return finishSignIn(data.user);
    } catch (err) {
      console.error(err);
      return { ok: false, error: NETWORK_ERROR };
    }
  };

  const resendOtp = async () => {
    if (!otp) return { ok: false as const, error: "Start again from the sign-in page." };
    try {
      const res = await fetch(otp.kind === "email" ? "/api/auth/resend-verify" : "/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: otp.challenge }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.restart) setOtp(null);
        return { ok: false as const, error: data.error || "Couldn't send a new code." };
      }
      setOtp({ kind: otp.kind, challenge: data.challenge, sentTo: data.sentTo });
      return { ok: true as const, sentTo: data.sentTo as string };
    } catch (err) {
      console.error(err);
      return { ok: false as const, error: NETWORK_ERROR };
    }
  };

  const cancelOtp = () => setOtp(null);

  const register = async (data: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
  }): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json().catch(() => ({}));
      // The new account confirms its email with the code we just sent, then it is signed in
      if (resData.verifyRequired && resData.challenge) {
        setOtp({ kind: "email", challenge: resData.challenge, sentTo: resData.sentTo });
        return { ok: false, error: "", otpRequired: true };
      }
      if (!res.ok) {
        return { ok: false, error: resData.error || "Couldn't create your account. Please try again." };
      }

      return finishSignIn(resData.user);
    } catch (err) {
      console.error(err);
      return { ok: false, error: NETWORK_ERROR };
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
        // the review prompt asks about it (components/ReviewPrompt.tsx)
        window.dispatchEvent(new CustomEvent("kml:downloaded", { detail: { assetType } }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Guard function for downloads
  const requireAuth = (action: () => void, intentReason?: string) => {
    // Admin setting "Require sign-in to download" switched off: no gate
    if (user || publicSettings?.requireAuthForDownload === false) {
      action();
    } else {
      setAuthIntentText(
        intentReason ||
          "Sign in or create a free account to download the Windows app."
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
        otp,
        verifyOtp,
        resendOtp,
        cancelOtp,
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
