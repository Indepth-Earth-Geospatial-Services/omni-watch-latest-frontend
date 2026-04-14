"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Menu, 
  Search, 
  FileText, 
  Download, 
  Bell, 
  Settings, 
  Zap, 
  RotateCcw,
  Activity
} from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  onToggleSidebar: () => void
}

export function Header({ title, subtitle, onToggleSidebar }: HeaderProps) {
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
          {/* Quick Actions */}
          <Button variant="outline" size="sm" className="hidden md:flex">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>

          <Button variant="outline" size="sm" className="hidden md:flex">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* System Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-secondary/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-foreground">All Systems Operational</span>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-secondary/30">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">JD</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}