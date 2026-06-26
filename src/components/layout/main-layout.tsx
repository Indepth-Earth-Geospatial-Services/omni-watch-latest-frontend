"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ProjectContextBar } from "./project-context-bar";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed } = useSidebar();

  return (
    <div className="bg-background text-foreground min-h-dvh">
      {/* Sidebar */}
      <Sidebar
        className={cn(
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <Header
          title={title}
          subtitle={subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        {/* Project context bar — shows active project name and a switch button.
            Renders only when a project is selected (guard in layout.tsx ensures this
            is always the case for dashboard pages). */}
        <ProjectContextBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
