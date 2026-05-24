"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  Download,
  Eye,
  Share2,
  Loader2,
  Settings,
  Calendar,
  CalendarDays,
  Plus,
  HardDrive,
  User,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/features/metrics/stat-card";

interface Report {
  id: number;
  name: string;
  type: string;
  format: string;
  size: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  period: string;
  description: string;
}

const sampleReports: Report[] = [
  {
    id: 1,
    name: "Daily Operations Summary - June 28, 2025",
    type: "daily",
    format: "pdf",
    size: "2.3 MB",
    status: "completed",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdBy: "John Doe",
    period: "June 28, 2025",
    description:
      "Comprehensive daily overview including 47 threats detected, 8 incidents processed, and system performance metrics",
  },
  {
    id: 2,
    name: "Weekly Threat Analysis - Week 26",
    type: "weekly",
    format: "excel",
    size: "5.7 MB",
    status: "completed",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: "Sarah Chen",
    period: "June 21-27, 2025",
    description:
      "Detailed weekly analysis of threat patterns, AI detection efficiency, and regional vulnerability assessment",
  },
  {
    id: 3,
    name: "Monthly Operational Report - June 2025",
    type: "monthly",
    format: "powerpoint",
    size: "12.1 MB",
    status: "processing",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    createdBy: "Michael Torres",
    period: "June 2025",
    description:
      "Comprehensive monthly overview with strategic insights, trend analysis, and executive summary for stakeholders",
  },
  {
    id: 4,
    name: "Incident Response Analysis - Q2 2025",
    type: "incident",
    format: "word",
    size: "8.4 MB",
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: "Alex Kim",
    period: "Q2 2025",
    description:
      "Detailed analysis of incident response effectiveness, timeline assessments, and lessons learned from Q2 operations",
  },
];

const templates: Record<string, any> = {
  daily: {
    name: "Daily Operations Summary",
    description:
      "Comprehensive daily overview including incidents, threats, and system status",
    sections: [
      "Executive Summary",
      "Threat Analysis",
      "Incident Summary",
      "System Performance",
    ],
  },
  weekly: {
    name: "Weekly Threat Analysis",
    description:
      "Detailed weekly analysis of threat patterns and detection efficiency",
    sections: [
      "Threat Trends",
      "AI Performance",
      "Regional Analysis",
      "Recommendations",
    ],
  },
  monthly: {
    name: "Monthly Operational Report",
    description:
      "Comprehensive monthly overview with trends and strategic insights",
    sections: [
      "Executive Summary",
      "Operational Metrics",
      "Trend Analysis",
      "Strategic Recommendations",
    ],
  },
  incident: {
    name: "Incident Analysis Report",
    description:
      "Detailed analysis of specific incidents and response effectiveness",
    sections: [
      "Incident Details",
      "Timeline Analysis",
      "Response Assessment",
      "Lessons Learned",
    ],
  },
  custom: {
    name: "Custom Report",
    description:
      "Build a custom report with your selected metrics and date range",
    sections: [
      "Custom Metrics",
      "Flexible Timeframe",
      "Tailored Analysis",
      "Specific Focus Areas",
    ],
  },
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily");
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState("today");
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Initializing...");

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-500";
      case "weekly":
        return "bg-purple-500";
      case "monthly":
        return "bg-orange-500";
      case "incident":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFormatIcon = (format: string): { icon: React.ComponentType<{ className?: string }>; color: string } => {
    switch (format) {
      case "pdf":
        return { icon: FileText, color: "text-red-500" };
      case "excel":
        return { icon: FileText, color: "text-green-500" };
      case "word":
        return { icon: FileText, color: "text-blue-500" };
      case "powerpoint":
        return { icon: FileText, color: "text-orange-500" };
      default:
        return { icon: FileText, color: "text-gray-500" };
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setProgress(0);

    const steps = [
      "Initializing...",
      "Collecting data...",
      "Processing threats...",
      "Analyzing incidents...",
      "Generating charts...",
      "Formatting document...",
      "Finalizing report...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressText(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsGenerating(false);
    setProgress(0);
    setProgressText("Initializing...");

    alert(
      `Report generated successfully!\nFormat: ${selectedFormat.toUpperCase()}\nType: ${reportType}`
    );
  };

  const currentTemplate = templates[reportType];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="Report Generation" subtitle="">
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors flex items-center">
              <Settings className="w-4 h-4 mr-2" />Templates
            </button>
            <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors flex items-center">
              <Calendar className="w-4 h-4 mr-2" />Schedule
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <StatCard
              title="Total Reports"
              value="128"
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="This Month"
              value="24"
              icon={CalendarDays}
              color="green"
            />
            <StatCard
              title="Scheduled"
              value="8"
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Downloads"
              value="347"
              icon={Download}
              color="purple"
            />
            <StatCard
              title="Storage Used"
              value="2.4GB"
              icon={HardDrive}
              color="red"
            />
          </div>

          {/* Report Generation Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2">
              <div className="bg-card p-6 rounded-lg border border-gray-800">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Plus className="text-blue-500 mr-2 w-4 h-4" />
                    <span>Generate New Report</span>
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Report Type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Report Type
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="daily">Daily Operations Summary</option>
                      <option value="weekly">Weekly Threat Analysis</option>
                      <option value="monthly">Monthly Operational Report</option>
                      <option value="incident">Incident Analysis Report</option>
                      <option value="custom">Custom Report</option>
                    </select>
                  </div>

                  {/* Output Format */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Output Format
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["pdf", "excel", "word", "ppt"].map((format) => {
                        const formatInfo = getFormatIcon(format);
                        return (
                          <button
                            key={format}
                            onClick={() => setSelectedFormat(format)}
                            className={`px-4 py-2 border rounded-md transition-colors flex items-center justify-center ${
                              selectedFormat === format
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "border-gray-600 hover:bg-blue-500 hover:border-blue-500"
                            }`}
                          >
                            <formatInfo.icon
                              className={`${
                                selectedFormat === format
                                  ? "text-white"
                                  : formatInfo.color
                              } mr-2 w-4 h-4`}
                            />
                            {format === "ppt" ? "PowerPoint" : format.charAt(0).toUpperCase() + format.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => {
                        setDateRange(e.target.value);
                        setShowCustomDates(e.target.value === "custom");
                      }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last-7-days">Last 7 Days</option>
                      <option value="last-30-days">Last 30 Days</option>
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Custom Date Inputs */}
                  {showCustomDates && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  )}

                  {/* Report Sections */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Include Sections
                    </label>
                    <div className="space-y-2">
                      {[
                        "Executive Summary",
                        "Threat Analysis",
                        "Incident Summary",
                        "System Performance",
                        "Recommendations",
                      ].map((section, index) => (
                        <label key={section} className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked={index < 4}
                            className="mr-2 rounded border-border bg-input text-blue-500 focus:ring-ring"
                          />
                          <span className="text-sm text-gray-300">{section}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4 border-t border-gray-800">
                    <button
                      onClick={handleGenerateReport}
                      className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      <span>Generate Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Preview & Stats */}
            <div className="space-y-6">
              {/* Template Preview */}
              <div className="bg-card p-6 rounded-lg border border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-4">
                  Template Preview
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-100">
                      {currentTemplate.name}
                    </h5>
                    <p className="text-sm text-gray-400 mt-1">
                      {currentTemplate.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400">
                      INCLUDED SECTIONS
                    </p>
                    <div className="space-y-1">
                      {currentTemplate.sections.map((section: string) => (
                        <div
                          key={section}
                          className="flex items-center space-x-2 text-xs"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-300">{section}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-card p-6 rounded-lg border border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-4">
                  Report Statistics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Reports Generated (30d)
                    </span>
                    <span className="text-sm font-medium text-gray-100">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Scheduled Reports
                    </span>
                    <span className="text-sm font-medium text-gray-100">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Avg Generation Time
                    </span>
                    <span className="text-sm font-medium text-gray-100">
                      2.4s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Success Rate</span>
                    <span className="text-sm font-medium text-green-400">
                      99.2%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Reports List */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="text-blue-500 mr-2 w-5 h-5" />
                <span>
                  Generated Reports (<span>{sampleReports.length}</span>)
                </span>
              </h3>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {sampleReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border ${
                      report.type === "daily"
                        ? "bg-blue-500 bg-opacity-5 border-blue-500 border-opacity-20"
                        : report.type === "weekly"
                        ? "bg-purple-500 bg-opacity-5 border-purple-500 border-opacity-20"
                        : report.type === "monthly"
                        ? "bg-orange-500 bg-opacity-5 border-orange-500 border-opacity-20"
                        : "bg-green-500 bg-opacity-5 border-green-500 border-opacity-20"
                    } hover:shadow-md cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-100">
                                {report.name}
                              </h3>
                              <span
                                className={`text-xs ${getReportTypeColor(
                                  report.type
                                )} text-white px-2 py-1 rounded`}
                              >
                                {report.type.toUpperCase()}
                              </span>
                              <span
                                className={`text-xs ${getStatusColor(
                                  report.status
                                )} text-white px-2 py-1 rounded`}
                              >
                                {report.status === "processing"
                                  ? "PROCESSING"
                                  : "COMPLETED"}
                              </span>
                              <div
                                className={`text-sm font-mono ${
                                  report.type === "daily"
                                    ? "text-blue-400"
                                    : report.type === "weekly"
                                    ? "text-purple-400"
                                    : report.type === "monthly"
                                    ? "text-orange-400"
                                    : "text-green-400"
                                }`}
                              >
                                {report.format.toUpperCase()} • {report.size}
                              </div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {report.description}
                            </p>
                          </div>
                          <button className="p-2 hover:bg-graybg rounded-md transition-colors">
                            {report.status === "processing"
                              ? <Clock className="text-gray-400 w-4 h-4" />
                              : <Download className="text-gray-400 w-4 h-4" />
                            }
                          </button>
                        </div>

                        <div className="flex items-center space-x-6 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {report.status === "processing"
                                ? "Started: " + formatTimeAgo(report.createdAt)
                                : "Generated: " + formatTimeAgo(report.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>By: {report.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Period: {report.period}</span>
                          </div>
                        </div>

                        {report.status === "processing" ? (
                          <div className="flex items-center space-x-2 pt-2">
                            <div className="text-sm text-yellow-400 flex items-center">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing... 78% complete
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 pt-2">
                            <button className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-colors flex items-center">
                              <Eye className="w-3 h-3 mr-1" />Preview
                            </button>
                            <button className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-600 hover:text-white transition-colors flex items-center">
                              <Download className="w-3 h-3 mr-1" />Download
                            </button>
                            <button className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-600 hover:text-white transition-colors flex items-center">
                              <Share2 className="w-3 h-3 mr-1" />Share
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

        {/* Loading Modal */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg border border-gray-800 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  Generating Report
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Please wait while we process your request...
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{progressText}</p>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </div>
  );
}