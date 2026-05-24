"use client"

import React, { useState, useEffect } from 'react'
import {
  Clock,
  Target,
  AlertTriangle,
  Wifi,
  Radio,
  BarChart2,
  Brain,
  CheckCircle,
  XCircle,
  Server,
  Bell,
  Download,
  RefreshCw,
  PlaneTakeoff,
  Video,
  ShieldCheck,
} from 'lucide-react'
import { StatCard } from '@/components/features/metrics/stat-card'
import { MainLayout } from '@/components/layout/main-layout'
import { feedData } from '@/lib/data'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [animateCharts, setAnimateCharts] = useState(false)

  // Use feedData as the source for analytics
  const allStreams = feedData.map(drone => ({
    id: drone.sn,
    name: drone.name,
    isOnline: drone.status === 'online',
    feedType: drone.feedType,
    startai: true // Default to true for visualization
  }))
  const onlineStreams = allStreams.filter(s => s.isOnline)
  const totalStreams = allStreams.length
  const onlineCount = onlineStreams.length
  const aiEnabledStreams = allStreams.filter(s => s.startai)
  const aiEnabledCount = aiEnabledStreams.length

  // Count by feed type
  const droneCount = allStreams.filter(s => s.feedType === 'DRONE').length
  const cctvCount = allStreams.filter(s => s.feedType === 'CCTV').length
  const bodyCamCount = allStreams.filter(s => s.feedType === 'BODY CAM').length

  // Calculate percentages
  const onlinePercentage = totalStreams > 0 ? (onlineCount / totalStreams) * 100 : 0
  const aiPercentage = totalStreams > 0 ? (aiEnabledCount / totalStreams) * 100 : 0

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setAnimateCharts(true), 100)
  }, [])

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="Analytics Dashboard" subtitle="Performance metrics and system insights">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />Export
              </button>
              <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </button>
            </div>
          </div>
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Avg Response Time"
              value="2.3 min"
              icon={Clock}
              color="blue"
              trend={{
                direction: 'down',
                value: '12% improvement'
              }}
            />

            <StatCard
              title="Detection Accuracy"
              value="94.2%"
              icon={Target}
              color="green"
              trend={{
                direction: 'up',
                value: '3% increase'
              }}
            />

            <StatCard
              title="False Positive Rate"
              value="5.8%"
              icon={AlertTriangle}
              color="yellow"
              trend={{
                direction: 'down',
                value: '8% reduction'
              }}
            />

            <StatCard
              title="System Uptime"
              value="99.1%"
              icon={Wifi}
              color="purple"
              trend={{
                direction: 'up',
                value: '1% increase'
              }}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active vs Registered Feeds - Radial Progress */}
            <div className="bg-card rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <h3 className="text-lg font-semibold flex items-center">
                  <Radio className="text-blue-500 mr-2 w-5 h-5" />
                  <span>Feed Status Overview</span>
                </h3>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Outer circle - Total Streams */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="20"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        fill="none"
                        stroke="url(#gradient1)"
                        strokeWidth="20"
                        strokeDasharray={`${animateCharts ? onlinePercentage * 6.28 : 0} 628`}
                        strokeLinecap="round"
                        className="transition-all duration-2000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <p className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
                          {onlineCount}/{totalStreams}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">Active Feeds</p>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                          {onlinePercentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">{onlineCount}</p>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                  <div className="text-center p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                    <p className="text-2xl font-bold text-gray-400">{totalStreams - onlineCount}</p>
                    <p className="text-xs text-gray-400">Offline</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Type Distribution - Animated Bars */}
            <div className="bg-card rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart2 className="text-purple-500 mr-2 w-5 h-5" />
                  <span>Feed Type Distribution</span>
                </h3>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {/* Drones */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <PlaneTakeoff className="text-blue-400 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-300">Drones</span>
                      </div>
                      <span className="text-lg font-bold text-blue-400">{droneCount}</span>
                    </div>
                    <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1500 ease-out flex items-center justify-end pr-3"
                        style={{ width: animateCharts ? `${totalStreams > 0 ? (droneCount / totalStreams) * 100 : 0}%` : '0%' }}
                      >
                        <span className="text-xs font-bold text-white">{totalStreams > 0 ? ((droneCount / totalStreams) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>

                  {/* CCTV */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Video className="text-green-400 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-300">CCTV</span>
                      </div>
                      <span className="text-lg font-bold text-green-400">{cctvCount}</span>
                    </div>
                    <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1500 ease-out delay-200 flex items-center justify-end pr-3"
                        style={{ width: animateCharts ? `${totalStreams > 0 ? (cctvCount / totalStreams) * 100 : 0}%` : '0%' }}
                      >
                        <span className="text-xs font-bold text-white">{totalStreams > 0 ? ((cctvCount / totalStreams) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>

                  {/* Body Cameras */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="text-purple-400 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-300">Body Cameras</span>
                      </div>
                      <span className="text-lg font-bold text-purple-400">{bodyCamCount}</span>
                    </div>
                    <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1500 ease-out delay-400 flex items-center justify-end pr-3"
                        style={{ width: animateCharts ? `${totalStreams > 0 ? (bodyCamCount / totalStreams) * 100 : 0}%` : '0%' }}
                      >
                        <span className="text-xs font-bold text-white">{totalStreams > 0 ? ((bodyCamCount / totalStreams) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Total Registered Feeds</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {totalStreams}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Detection Status - Donut Chart */}
            <div className="bg-card rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <h3 className="text-lg font-semibold flex items-center">
                  <Brain className="text-green-500 mr-2 w-5 h-5" />
                  <span>AI Detection Coverage</span>
                </h3>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="25"
                      />
                      {/* AI Enabled progress */}
                      <circle
                        cx="128"
                        cy="128"
                        r="100"
                        fill="none"
                        stroke="url(#gradientAI)"
                        strokeWidth="25"
                        strokeDasharray={`${animateCharts ? aiPercentage * 6.28 : 0} 628`}
                        strokeLinecap="round"
                        className="transition-all duration-2000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradientAI" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <Brain className="w-12 h-12 text-green-400 mb-2 animate-pulse" />
                        <p className="text-4xl font-bold text-green-400">
                          {aiEnabledCount}/{totalStreams}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">AI Enabled</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-all">
                    <CheckCircle className="w-6 h-6 text-green-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-green-400">{aiEnabledCount}</p>
                    <p className="text-xs text-gray-400">AI Active</p>
                  </div>
                  <div className="text-center p-4 bg-gray-500/10 rounded-lg border border-gray-500/30">
                    <XCircle className="w-6 h-6 text-gray-400 mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-gray-400">{totalStreams - aiEnabledCount}</p>
                    <p className="text-xs text-gray-400">No AI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-card rounded-lg border border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold flex items-center">
                  <Server className="text-orange-500 mr-2 w-5 h-5" />
                  <span>System Performance</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">AI Detection Rate</span>
                      <span className="text-sm font-medium">94.2%</span>
                    </div>
                    <div className="w-full bg-graybg rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: '94.2%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Network Uptime</span>
                      <span className="text-sm font-medium">99.1%</span>
                    </div>
                    <div className="w-full bg-graybg rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: '99.1%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Feed Availability</span>
                      <span className="text-sm font-medium">91.7%</span>
                    </div>
                    <div className="w-full bg-graybg rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: '91.7%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Response Efficiency</span>
                      <span className="text-sm font-medium">87.3%</span>
                    </div>
                    <div className="w-full bg-graybg rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: '87.3%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium text-gray-100">
                        Overall System Health
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">Optimal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <BarChart2 className="text-blue-500 mr-2 w-5 h-5" />
                <span>Operational Summary</span>
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-100 text-lg">
                    Incident Statistics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Total Incidents (7 days)</span>
                      <span className="font-bold text-lg">108</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Average per day</span>
                      <span className="font-bold text-lg">15.4</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Resolution rate</span>
                      <span className="font-bold text-lg text-green-400">88.9%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Critical incidents</span>
                      <span className="font-bold text-lg text-red-400">12</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-100 text-lg">
                    Threat Detection
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Total Threats Detected</span>
                      <span className="font-bold text-lg">96</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Verified Threats</span>
                      <span className="font-bold text-lg text-green-400">74</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">False Positives</span>
                      <span className="font-bold text-lg text-yellow-400">22</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">High Confidence (&gt;90%)</span>
                      <span className="font-bold text-lg text-blue-400">58</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-100 text-lg">
                    Coverage Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Active Surveillance Areas</span>
                      <span className="font-bold text-lg">36</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Online Video Feeds</span>
                      <span className="font-bold text-lg">5/6</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Coverage Area</span>
                      <span className="font-bold text-lg">923,768 km²</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-graybg rounded-lg">
                      <span className="text-sm text-gray-400">Active Sensors</span>
                      <span className="font-bold text-lg text-green-400">142/150</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Performance Alerts */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <Bell className="text-yellow-500 mr-2 w-5 h-5" />
                <span>Recent Performance Alerts</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-4 p-3 bg-yellow-500 bg-opacity-5 border border-yellow-500 border-opacity-20 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Network latency spike detected
                    </p>
                    <p className="text-xs text-gray-400">
                      Camera feed Alpha-1 experiencing 200ms delay • 15 min ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-red-500 bg-opacity-5 border border-red-500 border-opacity-20 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI model confidence drop</p>
                    <p className="text-xs text-gray-400">
                      Vehicle detection model showing 78% accuracy • 1h ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-green-500 bg-opacity-5 border border-green-500 border-opacity-20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      System optimization completed
                    </p>
                    <p className="text-xs text-gray-400">
                      Response time improved by 15% after maintenance • 2h ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  )
}