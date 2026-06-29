"use client"

import React from 'react'
import { Search } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  width?: string
}

interface SearchFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: FilterConfig[]
  className?: string
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  className = ""
}: SearchFilterProps) {
  return (
    <div className={`bg-card p-4 rounded-lg border border-gray-800 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Filters */}
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center space-x-2">
            <label className="text-sm font-medium whitespace-nowrap text-foreground">
              {filter.label}:
            </label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={`${filter.width || 'w-32'} px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}