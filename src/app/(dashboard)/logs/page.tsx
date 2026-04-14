"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";

interface LogEntry {
  id: number;
  level: "info" | "warning" | "error" | "critical";
  category: "system" | "security" | "audit" | "operational";
  source: string;
  message: string;
  details: string;
  timestamp: string;
  user?: string;
  ip?: string;
  icon: string;
}

const sampleLogs: LogEntry[] = [
  {
    id: 1,
    level: "info",
    category: "operational",
    source: "Video Feed Manager",
    message: "Video feed connection established",
    details: "Connection to satellite feed BIRD-EYE-01 established successfully",
    timestamp: "Jun 28, 2025 14:25:00",
    user: "admin@isr.mil",
    ip: "192.168.1.100",
    icon: "fa-chart-line",
  },
  {
    id: 2,
    level: "warning",
    category: "security",
    source: "Authentication Service",
    message: "Multiple failed login attempts detected",
    details:
      "IP address 203.0.113.45 attempted login 5 times with invalid credentials",
    timestamp: "Jun 28, 2025 14:10:00",
    ip: "203.0.113.45",
    icon: "fa-shield-alt",
  },
  {
    id: 3,
    level: "error",
    category: "system",
    source: "Database Manager",
    message: "Database connection timeout",
    details:
      "Connection to primary database exceeded 30-second timeout limit",
    timestamp: "Jun 28, 2025 13:55:00",
    user: "system",
    icon: "fa-database",
  },
  {
    id: 4,
    level: "info",
    category: "audit",
    source: "User Management",
    message: "User permissions updated",
    details: "User john.doe@isr.mil granted access to classified feeds",
    timestamp: "Jun 28, 2025 13:40:00",
    user: "admin@isr.mil",
    ip: "192.168.1.50",
    icon: "fa-user",
  },
  {
    id: 5,
    level: "critical",
    category: "security",
    source: "Intrusion Detection",
    message: "Potential security breach detected",
    details: "Unauthorized access attempt to secure zone Delta-7",
    timestamp: "Jun 28, 2025 12:25:00",
    ip: "10.0.0.255",
    icon: "fa-shield-alt",
  },
  {
    id: 6,
    level: "info",
    category: "operational",
    source: "Incident Manager",
    message: "New incident created",
    details: "High priority incident #INC-2025-001 created in sector Alpha-3",
    timestamp: "Jun 28, 2025 11:55:00",
    user: "operator@isr.mil",
    ip: "192.168.1.75",
    icon: "fa-chart-line",
  },
];

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "info":
        return {
          bg: "bg-blue-500 bg-opacity-20",
          text: "text-blue-300",
          icon: "text-blue-400",
        };
      case "warning":
        return {
          bg: "bg-yellow-500 bg-opacity-20",
          text: "text-yellow-300",
          icon: "text-yellow-400",
        };
      case "error":
        return {
          bg: "bg-orange-500 bg-opacity-20",
          text: "text-orange-300",
          icon: "text-orange-400",
        };
      case "critical":
        return {
          bg: "bg-red-500 bg-opacity-20",
          text: "text-red-300",
          icon: "text-red-400",
        };
      default:
        return {
          bg: "bg-gray-500 bg-opacity-20",
          text: "text-gray-300",
          icon: "text-gray-400",
        };
    }
  };

  const handleExportLogs = () => {
    // Simulate CSV export
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,Level,Category,Source,Message,Details,User,IP Address\n" +
      '"Jun 28, 2025 14:25:00","info","operational","Video Feed Manager","Video feed connection established","Connection to satellite feed BIRD-EYE-01 established successfully","admin@isr.mil","192.168.1.100"\n' +
      '"Jun 28, 2025 14:10:00","warning","security","Authentication Service","Multiple failed login attempts detected","IP address 203.0.113.45 attempted login 5 times with invalid credentials","","203.0.113.45"';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `isr_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      alert("Logs refreshed successfully!");
    }, 1000);
  };

  const filteredLogs = sampleLogs.filter((log) => {
    const matchesSearch =
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesCategory =
      categoryFilter === "all" || log.category === categoryFilter;

    return matchesSearch && matchesLevel && matchesCategory;
  });

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="System Logs" subtitle="">
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleExportLogs}
              className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors"
            >
              <i className="fas fa-download mr-2"></i>Export
            </button>
            <button
              onClick={handleRefresh}
              className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors"
            >
              <i
                className={`fas fa-sync-alt mr-2 ${
                  isRefreshing ? "fa-spin" : ""
                }`}
              ></i>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-card p-4 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-filter text-blue-500"></i>
              <h3 className="text-lg font-semibold">Filters</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <i className="fas fa-search absolute left-2 top-2.5 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-40 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="audit">Audit</option>
                <option value="operational">Operational</option>
              </select>
            </div>
          </div>

          {/* Logs Display */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Logs</h3>
                <p className="text-sm text-gray-400">
                  Showing <span>{filteredLogs.length}</span> of{" "}
                  {sampleLogs.length} log entries
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {filteredLogs.map((log) => {
                    const levelColors = getLevelColor(log.level);
                    return (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <i
                                className={`fas ${log.icon} ${levelColors.icon}`}
                              ></i>
                              <span
                                className={`text-xs ${levelColors.bg} ${levelColors.text} px-2 py-1 rounded`}
                              >
                                {log.level.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{log.source}</span>
                                <span className="text-sm text-gray-400">
                                  {log.timestamp}
                                </span>
                              </div>
                              <p className="text-sm mb-1">{log.message}</p>
                              <p className="text-xs text-gray-500">
                                {log.details}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {log.user && <span>User: {log.user}</span>}
                                {log.ip && <span>IP: {log.ip}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredLogs.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        No logs match your filter criteria
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}