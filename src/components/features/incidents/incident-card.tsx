"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Clock, MapPin, CreditCard } from 'lucide-react'

interface IncidentCardProps {
  title: string
  description: string
  status: 'OPEN' | 'RESOLVED' | 'IN PROGRESS' | 'MONITORING'
  timestamp: string
  location: string
  id: string
  className?: string
}

export function IncidentCard({ 
  title, 
  description, 
  status, 
  timestamp, 
  location, 
  id,
  className 
}: IncidentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-600 border-red-500'
      case 'RESOLVED':
        return 'bg-green-600 border-green-500'
      case 'IN PROGRESS':
        return 'bg-yellow-500 border-yellow-500'
      case 'MONITORING':
        return 'bg-blue-600 border-blue-500'
      default:
        return 'bg-gray-600 border-gray-500'
    }
  }

  return (
    <Card className={cn(
      "incident-item p-4 bg-card border-l-4 transition-all hover:translate-x-1",
      getStatusColor(status).split(' ')[1],
      className
    )}>
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          <span className={cn(
            "text-xs px-2 py-1 rounded font-bold text-white",
            getStatusColor(status).split(' ')[0]
          )}>
            {status}
          </span>
        </div>
        <p className="text-muted-foreground text-xs mb-2">{description}</p>
        <div className="text-muted-foreground text-xs flex items-center gap-3">
          <span className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {timestamp}
          </span>
          <span className="flex items-center">
            <MapPin className="mr-1 h-3 w-3" />
            {location}
          </span>
          <span className="flex items-center">
            <CreditCard className="mr-1 h-3 w-3" />
            ID: {id}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}