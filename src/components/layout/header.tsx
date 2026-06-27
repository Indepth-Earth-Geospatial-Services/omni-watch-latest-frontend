"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Bell, ChevronDown, LogOut, User, Building2, Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  subtitle?: string
  onToggleSidebar: () => void
}

export function Header({ title, subtitle, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.username ?? 'User'
  const firstName = displayName.split(' ')[0]
  const initials = firstName.slice(0, 2).toUpperCase()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    setIsLoggingOut(true)
    setDropdownOpen(false)
    logout()
    router.push('/sign-in')
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <h2 className="font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground hidden md:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-600 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-[#1A1C20] border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 z-50 font-poppins overflow-hidden">
                {/* Profile header */}
                <div className="px-4 py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{displayName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">
                        {user?.user_id?.slice(0, 16)}…
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="px-4 py-3 space-y-2.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <User size={12} className="text-zinc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600">
                        User ID
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">
                        {user?.user_id || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Building2 size={12} className="text-zinc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600">
                        Workspace
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">
                        {user?.workspace_id || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign out */}
                <div className="px-2 py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-60"
                  >
                    {isLoggingOut ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <LogOut size={14} />
                    )}
                    {isLoggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
