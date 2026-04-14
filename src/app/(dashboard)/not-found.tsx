"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";

export default function DashboardNotFound() {
  return (
    <MainLayout title="Page Not Found" subtitle="">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <i className="fas fa-map-marked-alt text-gray-600 text-6xl mb-4"></i>
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
                <i className="fas fa-video text-blue-500 text-xl"></i>
                <span className="text-sm">Live Feeds</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <i className="fas fa-tachometer-alt text-green-500 text-xl"></i>
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link
                href="/ai-detection"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <i className="fas fa-brain text-purple-500 text-xl"></i>
                <span className="text-sm">AI Detection</span>
              </Link>
              <Link
                href="/threats"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <i className="fas fa-shield-alt text-red-500 text-xl"></i>
                <span className="text-sm">Threats</span>
              </Link>
              <Link
                href="/analytics"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <i className="fas fa-chart-line text-cyan-500 text-xl"></i>
                <span className="text-sm">Analytics</span>
              </Link>
              <Link
                href="/reports"
                className="px-4 py-3 bg-graybg border border-gray-700 rounded-md hover:border-blue-500 hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
              >
                <i className="fas fa-file-alt text-orange-500 text-xl"></i>
                <span className="text-sm">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}