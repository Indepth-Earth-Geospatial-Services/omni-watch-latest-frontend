"use client";

// Provider tree — order matters:
//   ThemeProvider  → outermost, applies dark/light to the whole document
//   AuthProvider   → second, manages JWT state and current user profile
//   QueryProvider  → innermost, React Query cache sits inside auth so queries can access user context

import * as React from "react";
import { AuthProvider } from "./AuthProvider";
import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"       // next-themes toggles className on <html> ("dark" | "light")
      defaultTheme="dark"     // matches the current hardcoded className="dark" on <html>
      disableTransitionOnChange // prevents a flash of unstyled content on theme switch
    >
      <AuthProvider>
        <QueryProvider>{children}</QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
