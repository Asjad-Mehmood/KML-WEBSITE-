"use client";

// The sign-in window and the notices that float over every page. Each shows nothing until the
// page is running (they read the visitor's state in the browser), so their code loads after the
// page itself instead of with it.
import dynamic from "next/dynamic";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const SiteNotice = dynamic(() => import("@/components/SiteNotice"), { ssr: false });
const MovedNotice = dynamic(() => import("@/components/MovedNotice"), { ssr: false });
const SignupPrompt = dynamic(() => import("@/components/SignupPrompt"), { ssr: false });
const DownloadNotice = dynamic(() => import("@/components/DownloadNotice"), { ssr: false });
const ReviewPrompt = dynamic(() => import("@/components/ReviewPrompt"), { ssr: false });

export function SignInWindow() {
  return <AuthModal />;
}

export function PageNotices() {
  return (
    <>
      <SiteNotice />
      <MovedNotice />
      <SignupPrompt />
    </>
  );
}

export function LaterNotices() {
  return (
    <>
      <DownloadNotice />
      <ReviewPrompt />
    </>
  );
}
