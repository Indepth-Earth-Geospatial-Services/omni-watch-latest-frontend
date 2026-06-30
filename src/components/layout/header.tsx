"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Bell, Settings, ChevronDown, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import SettingsModal from '@/components/settings/SettingsModal'

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
  const [themeOpen, setThemeOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.username ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—'

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
    <>
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center space-x-4">
              <h2 className="font-semibold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground hidden md:block">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setThemeOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>

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
                  className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-card border border-border rounded-xl shadow-2xl shadow-black/60 z-50 font-ui overflow-hidden">
                  <div className="px-4 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold mt-0.5">
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>

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

      <SettingsModal open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  )
}
