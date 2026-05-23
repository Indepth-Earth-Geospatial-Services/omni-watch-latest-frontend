"use client";

// Provider tree — order matters:
//   ThemeProvider   → outermost, applies dark/light to the whole document
//   AuthProvider    → second, manages JWT state and current user profile
//   QueryProvider   → React Query cache (must wrap ProjectProvider so project queries work)
//   ProjectProvider → innermost, holds the active project selection for all dashboard children

import * as React from "react";
import { AuthProvider } from "./AuthProvider";
import { ProjectProvider } from "./ProjectProvider";
import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"       // next-themes toggles className on <html> ("dark" | "light")
      defaultTheme="dark"     // matches the current hardcoded className="dark" on <html>
      disableTransitionOnChange // prevents a flash of unstyled content on theme switch
    >
      <AuthProvider>
        <QueryProvider>
          <ProjectProvider>{children}</ProjectProvider>
          <Toaster richColors position='top-right' />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
