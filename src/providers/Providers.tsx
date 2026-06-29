'use client';

// Provider tree — order matters:
//   ThemeProvider   → outermost, applies dark/light to the whole document
//   AuthProvider    → second, manages JWT state and current user profile
//   QueryProvider   → React Query cache (must wrap ProjectProvider so project queries work)
//   ProjectProvider → innermost, holds the active project selection for all dashboard children
//   SidebarProvider → sidebar collapsed state (localStorage persisted)

import * as React from 'react';
import { AuthProvider } from './AuthProvider';
import { ProjectProvider } from './ProjectProvider';
import QueryProvider from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='dark'
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <QueryProvider>
          <ProjectProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ProjectProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
