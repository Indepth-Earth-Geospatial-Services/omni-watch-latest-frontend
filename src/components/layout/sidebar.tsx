"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Satellite,
  Gauge,
  Video,
  Globe,
  AlertTriangle,
  Target,
  Brain,
  TrendingUp,
  FileText,
  Users,
  Terminal,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const navigation = [
  { name: "Dashboard",       href: "/dashboard",    icon: Gauge },
  { name: "Live Feeds",      href: "/live-feed",    icon: Video },
  { name: "Geospatial Map",  href: "/geospatial",   icon: Globe },
  { name: "Incidents",       href: "/incidents",    icon: AlertTriangle },
  { name: "Threat Detection",href: "/threats",      icon: Target },
  { name: "AI Detection",    href: "/ai-detection", icon: Brain },
  { name: "Analytics",       href: "/analytics",    icon: TrendingUp },
  { name: "Reports",         href: process.env.NEXT_PUBLIC_REPORTS_URL || "/reports", icon: FileText },
  { name: "User Management", href: "/users",        icon: Users },
  { name: "System Logs",     href: "/logs",         icon: Terminal },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  function handleSignOut() {
    logout();                    // clears JWT from localStorage and expires the cookie
    router.push("/sign-in");     // proxy will also redirect here on next navigation, but be explicit
  }

  // Derive display values from live user profile, fall back gracefully while loading
  const displayName = user?.username ?? "—";
  const displayRole = user?.user_type === 1 ? "Admin" : user ? "Operator" : "—";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <h1 className="text-lg font-bold text-sky-400 flex items-center">
          <Link href="/" className="flex items-center">
            <Satellite className="mr-2 h-5 w-5" />
            ISR C&amp;C
          </Link>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-none transition-colors",
                isActive
                  ? "bg-graybg border-l-2 border-sky-500 text-foreground"
                  : "text-muted-foreground hover:bg-graybg hover:text-foreground"
              )}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="text-sm text-muted-foreground">
          {displayName}
          <br />
          <span className="text-xs">{displayRole}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center text-xs text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="mr-1 h-3 w-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
