"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <i className="fas fa-satellite-dish text-sky-400 text-6xl mb-4"></i>
          <h1 className="text-9xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-4xl font-bold mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border border-gray-800 mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
            <h3 className="text-xl font-semibold">Navigation Error</h3>
          </div>
          <p className="text-gray-400 mb-6">
            The requested resource could not be located in the system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fas fa-home"></i>
              <span>Go Home</span>
            </Link>
            <Link
              href="/live-feed"
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-md hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fas fa-video"></i>
              <span>Live Feeds</span>
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
}