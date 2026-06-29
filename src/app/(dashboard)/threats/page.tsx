"use client"

import React, { useState, useCallback } from 'react'
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Brain,
  TrendingUp,
  Clock,
  MapPin,
  Video,
  Eye,
  AlertTriangle,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { StatCard } from '@/components/features/metrics/stat-card'
import { SearchFilter } from '@/components/features/filters/search-filter'
import { formatTimeAgo } from '@/lib/utils'

interface Threat {
  id: number
  type: string
  description: string
  confidence: number
  isVerified: boolean
  detectedAt: Date
  latitude: number
  longitude: number
  videoFeedId: string
}

const threats: Threat[] = [
  {
    id: 1,
    type: "WEAPON_DETECTION",
    description: "Potential firearm detected in individual's possession near facility perimeter",
    confidence: 0.873,
    isVerified: false,
    detectedAt: new Date(Date.now() - 23 * 60 * 1000),
    latitude: 6.4238,
    longitude: 3.4219,
    videoFeedId: "cam-0183",
  },
  {
    id: 2,
    type: "UNAUTHORIZED_ENTRY",
    description: "Individual breached secured perimeter via fence section at checkpoint Alpha-7",
    confidence: 0.941,
    isVerified: true,
    detectedAt: new Date(Date.now() - 60 * 60 * 1000),
    latitude: 6.4455,
    longitude: 3.3958,
    videoFeedId: "cam-0247",
  },
  {
    id: 3,
    type: "PIPELINE_DAMAGE",
    description: "Potential structural damage detected on pipeline section KM-47 via thermal imaging",
    confidence: 0.768,
    isVerified: false,
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    latitude: 7.2389,
    longitude: 4.1201,
    videoFeedId: "THM-091",
  },
  {
    id: 4,
    type: "CROWD_FORMATION",
    description: "Large gathering of 40+ individuals detected at market square during non-operational hours",
    confidence: 0.892,
    isVerified: true,
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    latitude: 12.0022,
    longitude: 8.5917,
    videoFeedId: "cam-0156",
  },
]

export default function ThreatsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [filteredThreats, setFilteredThreats] = useState<Threat[]>(threats)


  const filterThreats = useCallback(() => {
    const filtered = threats.filter((threat) => {
      const matchesSearch = !searchTerm ||
        threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'verified' && threat.isVerified) ||
        (statusFilter === 'pending' && !threat.isVerified)

      const matchesType = typeFilter === 'all' || threat.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    setFilteredThreats(filtered)
  }, [searchTerm, statusFilter, typeFilter])

  React.useEffect(() => {
    filterThreats()
  }, [filterThreats])

  const getThreatColors = (threat: Threat) => {
    if (threat.isVerified) {
      return "bg-green-500 bg-opacity-5 border-green-500 border-opacity-20"
    }
    if (threat.confidence >= 0.8) {
      return "bg-red-500 bg-opacity-5 border-red-500 border-opacity-20"
    }
    return "bg-orange-500 bg-opacity-5 border-orange-500 border-opacity-20"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-400"
    if (confidence >= 0.8) return "text-yellow-400"
    return "text-red-400"
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "WEAPON_DETECTION": "bg-red-500",
      "UNAUTHORIZED_ENTRY": "bg-purple-500",
      "PIPELINE_DAMAGE": "bg-red-600",
      "CROWD_FORMATION": "bg-yellow-500",
      "HUMAN_DETECTION": "bg-blue-500",
      "VEHICLE_DETECTION": "bg-green-500",
      "BOAT_DETECTION": "bg-cyan-500",
      "SUSPICIOUS_BEHAVIOR": "bg-orange-500",
      "ABANDONED_OBJECT": "bg-gray-500",
      "LEAK_DETECTION": "bg-red-500",
      "EXCAVATION_ACTIVITY": "bg-brown-500"
    }
    return colors[type] || "bg-gray-500"
  }

  const totalThreats = threats.length
  const verifiedThreats = threats.filter(t => t.isVerified).length
  const pendingThreats = totalThreats - verifiedThreats
  const highConfidence = threats.filter(t => t.confidence >= 0.8).length
  const todayThreats = threats.filter(t => {
    const threatDate = new Date(t.detectedAt)
    const todayDate = new Date()
    return threatDate.toDateString() === todayDate.toDateString()
  }).length

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="Threat Intelligence" subtitle="">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <StatCard
              title="Total Threats"
              value={totalThreats}
              icon={ShieldAlert}
              color="blue"
            />

            <StatCard
              title="Verified"
              value={verifiedThreats}
              icon={CheckCircle}
              color="green"
            />

            <StatCard
              title="Pending"
              value={pendingThreats}
              icon={XCircle}
              color="orange"
            />

            <StatCard
              title="High Confidence"
              value={highConfidence}
              icon={Brain}
              color="purple"
            />

            <StatCard
              title="Today"
              value={todayThreats}
              icon={TrendingUp}
              color="red"
            />
          </div>

          {/* Filters and Search */}
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search threats by description or type..."
            filters={[
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                width: "w-32",
                options: [
                  { value: "all", label: "All Status" },
                  { value: "verified", label: "Verified" },
                  { value: "pending", label: "Pending" }
                ]
              },
              {
                label: "Type",
                value: typeFilter,
                onChange: setTypeFilter,
                width: "w-48",
                options: [
                  { value: "all", label: "All Types" },
                  { value: "HUMAN_DETECTION", label: "Human Detection" },
                  { value: "VEHICLE_DETECTION", label: "Vehicle Detection" },
                  { value: "BOAT_DETECTION", label: "Boat Detection" },
                  { value: "WEAPON_DETECTION", label: "Weapon Detection" },
                  { value: "SUSPICIOUS_BEHAVIOR", label: "Suspicious Behavior" },
                  { value: "UNAUTHORIZED_ENTRY", label: "Unauthorized Entry" },
                  { value: "CROWD_FORMATION", label: "Crowd Formation" },
                  { value: "ABANDONED_OBJECT", label: "Abandoned Object" },
                  { value: "PIPELINE_DAMAGE", label: "Pipeline Damage" },
                  { value: "LEAK_DETECTION", label: "Leak Detection" },
                  { value: "EXCAVATION_ACTIVITY", label: "Excavation Activity" }
                ]
              }
            ]}
          />

          {/* Threats List */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <ShieldAlert className="text-blue-500 mr-2 w-5 h-5" />
                <span>Detected Threats ({filteredThreats.length})</span>
              </h3>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {filteredThreats.map((threat) => (
                  <div
                    key={threat.id}
                    className={`p-4 rounded-lg border ${getThreatColors(threat)} hover:shadow-md cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-100">
                                {threat.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h3>
                              <span className={`text-xs ${getTypeColor(threat.type)} text-white px-2 py-1 rounded`}>
                                {threat.type}
                              </span>
                              <span className={`text-xs ${threat.isVerified ? 'bg-green-500' : 'bg-orange-500'} text-white px-2 py-1 rounded`}>
                                {threat.isVerified ? 'Verified' : 'Pending'}
                              </span>
                              <div className={`text-sm font-mono ${getConfidenceColor(threat.confidence)}`}>
                                {(threat.confidence * 100).toFixed(1)}% confidence
                              </div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {threat.description}
                            </p>
                          </div>
                          <button className="p-2 hover:bg-graybg rounded-md transition-colors">
                            <Eye className="text-gray-400 w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-6 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(threat.detectedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{threat.latitude.toFixed(4)}, {threat.longitude.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Video className="w-3 h-3" />
                            <span>{threat.videoFeedId.startsWith('THM') ? 'Thermal Sensor' : 'Video Source'}: {threat.videoFeedId}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Automated Analysis</span>
                          </div>
                        </div>

                        {!threat.isVerified && (
                          <div className="flex items-center space-x-2 pt-2">
                            <button className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-600 hover:text-white transition-colors flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />Verify Threat
                            </button>
                            <button className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors flex items-center">
                              <XCircle className="w-3 h-3 mr-1" />Dismiss
                            </button>
                            <button className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-600 hover:text-white transition-colors flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />Create Incident
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  )
}