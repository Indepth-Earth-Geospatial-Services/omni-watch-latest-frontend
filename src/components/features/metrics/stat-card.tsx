"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: string // FontAwesome icon class
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'indigo'
  trend?: {
    direction: 'up' | 'down'
    value: string
    isPositive?: boolean
  }
  className?: string
  variant?: 'default' | 'hover-border'
}

const colorConfig = {
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'hover:border-red-500/30'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'hover:border-yellow-500/30'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'hover:border-green-500/30'
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'hover:border-blue-500/30'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'hover:border-purple-500/30'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'hover:border-orange-500/30'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'hover:border-indigo-500/30'
  }
}

export function StatCard({
  title,
  value,
  icon,
  color,
  trend,
  className,
  variant = 'default'
}: StatCardProps) {
  const colors = colorConfig[color]

  return (
    <div className={cn(
      "bg-card p-6 rounded-lg border border-gray-800",
      variant === 'hover-border' && colors.border,
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className={cn("p-3 rounded-lg", colors.bg)}>
          <i className={cn(icon, colors.text, "text-xl")}></i>
        </div>
        <div className={trend ? "flex-1" : ""}>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
          <p className="text-sm text-gray-400">{title}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <i className={cn(
                "text-xs mr-1",
                trend.direction === 'up' ? "fas fa-arrow-up" : "fas fa-arrow-down",
                trend.isPositive !== false
                  ? (trend.direction === 'up' ? "text-green-400" : "text-red-400")
                  : (trend.direction === 'up' ? "text-red-400" : "text-green-400")
              )}></i>
              <span className={cn(
                "text-xs",
                trend.isPositive !== false
                  ? (trend.direction === 'up' ? "text-green-400" : "text-red-400")
                  : (trend.direction === 'up' ? "text-red-400" : "text-green-400")
              )}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}