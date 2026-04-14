"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: {
    value: string
    type: 'increase' | 'decrease'
  }
  iconColor?: string
  borderColor?: string
  className?: string
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  iconColor = "text-blue-500",
  borderColor = "hover:border-blue-500/30",
  className 
}: MetricCardProps) {
  return (
    <Card className={cn(
      "metric-card p-6 transition-all hover:shadow-lg border-border",
      borderColor,
      className
    )}>
      <CardContent className="p-0">
        <div className="flex items-center space-x-4">
          <div className={cn("p-3 rounded-lg", iconColor.replace('text-', 'bg-').replace('-500', '-500/10'))}>
            <Icon className={cn("text-xl h-6 w-6", iconColor)} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change.type === 'increase' ? (
                  <ArrowUp className={cn(
                    "text-xs h-3 w-3 mr-1",
                    change.type === 'increase' ? "text-red-400" : "text-green-400"
                  )} />
                ) : (
                  <ArrowDown className="text-green-400 text-xs h-3 w-3 mr-1" />
                )}
                <span className={cn(
                  "text-xs",
                  change.type === 'increase' ? "text-red-400" : "text-green-400"
                )}>
                  {change.value}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}