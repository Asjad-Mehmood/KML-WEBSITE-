"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";

type Props = Omit<React.ComponentProps<typeof Link>, "href">;

// /app answers signed-out visitors (and search engine crawlers) with a redirect to
// the sign-in page, so link them straight there; signed-in users go to the app itself
export default function WebAppLink(props: Props) {
  const { user } = useAuth();
  return <Link {...props} href={user ? "/app" : WEB_APP_LOGIN_URL} />;
}
