"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AutoRedirect({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // If the user is not authenticated and the page is not the login page
    if (status === "unauthenticated" && pathname !== "/") {
      router.push("/");
    }
  }, [status, router, pathname]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  // If we're not on the login page and user is not authenticated, don't show content
  if (pathname !== "/" && status === "unauthenticated") {
    return null;
  }

  // User is authenticated or this is the login page, show content
  return <>{children}</>;
}