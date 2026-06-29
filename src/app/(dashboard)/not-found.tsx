"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { MapPin, Video, Gauge, Brain, ShieldAlert, TrendingUp, FileText } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <MainLayout title="Page Not Found" subtitle="">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <MapPin className="text-gray-600 w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-7xl font-bold text-gray-700 mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-4">Dashboard Page Not Found</h2>
            <p className="text-lg text-gray-400 mb-8">
              The dashboard page you're looking for doesn't exist.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-gray-800 mb-6">
            <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link
                href="/live-feed"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <Video className="text-blue-500 w-5 h-5" />
                <span className="text-sm">Live Feeds</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <Gauge className="text-green-500 w-5 h-5" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link
                href="/ai-detection"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <Brain className="text-purple-500 w-5 h-5" />
                <span className="text-sm">AI Detection</span>
              </Link>
              <Link
                href="/threats"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <ShieldAlert className="text-red-500 w-5 h-5" />
                <span className="text-sm">Threats</span>
              </Link>
              <Link
                href="/analytics"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <TrendingUp className="text-cyan-500 w-5 h-5" />
                <span className="text-sm">Analytics</span>
              </Link>
              <Link
                href="/reports"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <FileText className="text-orange-500 w-5 h-5" />
                <span className="text-sm">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}