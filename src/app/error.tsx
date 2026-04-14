"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <i className="fas fa-exclamation-circle text-red-500 text-6xl mb-4"></i>
          <h1 className="text-4xl font-bold mb-4">System Error</h1>
          <p className="text-xl text-gray-400 mb-8">
            Something went wrong while processing your request.
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border border-gray-800 mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <i className="fas fa-bug text-orange-500 text-2xl"></i>
            <h3 className="text-xl font-semibold">Error Details</h3>
          </div>

          <div className="bg-card p-4 rounded-md mb-6 text-left border border-border">
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fas fa-redo"></i>
              <span>Try Again</span>
            </button>
            <a
              href="/live-feed"
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-md hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fas fa-home"></i>
              <span>Go to Dashboard</span>
            </a>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-yellow-500 mt-1"></i>
            <div className="text-left">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Troubleshooting Steps:</strong>
              </p>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Refresh the page and try again</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Contact system administrator if the issue persists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}