"use client";

import React, { useState } from "react";
import {
  FileText,
  PlaneTakeoff,
  HardDrive,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  List,
  Inbox,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useDJIDevices } from "@/hooks/useDJIDevices";
import { useUploadedLogs, useDeleteLogFile, useCancelLogUpload } from "@/hooks/useDeviceLogs";
import type { UploadedLog } from "@/lib/types";

const STATUS_LABEL: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: "Uploading", bg: "bg-yellow-500 bg-opacity-20", text: "text-yellow-300" },
  1: { label: "Done",      bg: "bg-green-500 bg-opacity-20",  text: "text-green-300"  },
  2: { label: "Failed",    bg: "bg-red-500 bg-opacity-20",    text: "text-red-300"    },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatTs(ts: number): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function LogRow({
  log,
  onDelete,
  onCancel,
  isDeleting,
  isCanceling,
}: {
  log: UploadedLog;
  onDelete: (logsId: string) => void;
  onCancel: (logsId: string) => void;
  isDeleting: boolean;
  isCanceling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_LABEL[log.status] ?? STATUS_LABEL[2];
  const totalSize = log.list?.reduce((s, f) => s + (f.size ?? 0), 0) ?? 0;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 hover:bg-gray-700/30 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="text-blue-400 shrink-0 w-4 h-4" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-100 font-mono text-sm truncate">
                {log.logsId}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5 flex gap-4">
              <span className="flex items-center gap-1">
                <PlaneTakeoff className="w-3 h-3" />
                {log.deviceSn}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatBytes(totalSize)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTs(log.createTime)}
              </span>
              <span>{log.list?.length ?? 0} file(s)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {log.status === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(log.logsId); }}
              disabled={isCanceling}
              className="px-2 py-1 text-xs border border-yellow-600 text-yellow-400 rounded hover:bg-yellow-900/30 disabled:opacity-50"
            >
              {isCanceling ? "Canceling…" : "Cancel"}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(log.logsId); }}
            disabled={isDeleting}
            className="p-1.5 hover:bg-gray-600 rounded"
            title="Delete log"
          >
            <Trash2 className="text-red-400 w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="text-gray-500 w-4 h-4" /> : <ChevronDown className="text-gray-500 w-4 h-4" />}
        </div>
      </div>

      {expanded && log.list && log.list.length > 0 && (
        <div className="border-t border-gray-700 bg-gray-800/40 p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-1 px-2">Module</th>
                <th className="text-left py-1 px-2">Start</th>
                <th className="text-left py-1 px-2">End</th>
                <th className="text-left py-1 px-2">Size</th>
              </tr>
            </thead>
            <tbody>
              {log.list.map((file, i) => (
                <tr key={i} className="border-b border-gray-700/50 last:border-0">
                  <td className="py-1 px-2 text-gray-300">{file.module}</td>
                  <td className="py-1 px-2 text-gray-300">{formatTs(file.startTime)}</td>
                  <td className="py-1 px-2 text-gray-300">{formatTs(file.endTime)}</td>
                  <td className="py-1 px-2 text-gray-300">{formatBytes(file.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [selectedDeviceSn, setSelectedDeviceSn] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: devices = [], isLoading: devicesLoading } = useDJIDevices();

  const {
    data: rawLogs = [],
    isLoading: logsLoading,
    error: logsError,
    refetch,
  } = useUploadedLogs(selectedDeviceSn || undefined);

  const { mutate: deletLog, isPending: isDeleting } = useDeleteLogFile();
  const { mutate: cancelLog, isPending: isCanceling } = useCancelLogUpload();

  const filteredLogs = rawLogs.filter((log) => {
    const matchesStatus =
      statusFilter === "all" || log.status === Number(statusFilter);
    const matchesSearch = log.logsId
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function handleDelete(deviceSn: string, logsId: string) {
    deletLog({ deviceSn, logsId });
  }

  function handleCancel(deviceSn: string, logsId: string) {
    cancelLog({
      deviceSn,
      payload: { moduleList: ["0"], status: "cancel" },
    });
    void logsId;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="Device Logs" subtitle="Upload and manage drone subsystem logs">
        <div className="space-y-6">
          {/* Device Selector + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <PlaneTakeoff className="text-blue-400 w-4 h-4" />
              <select
                value={selectedDeviceSn}
                onChange={(e) => setSelectedDeviceSn(e.target.value)}
                className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a device…</option>
                {devicesLoading ? (
                  <option disabled>Loading devices…</option>
                ) : (
                  devices.map((d) => (
                    <option key={d.deviceSn} value={d.deviceSn}>
                      {d.deviceName || d.deviceSn}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={() => refetch()}
              disabled={!selectedDeviceSn || logsLoading}
              className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-card p-4 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="text-blue-500 w-5 h-5" />
              <h3 className="text-lg font-semibold">Filters</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by log ID…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="0">Uploading</option>
                <option value="1">Done</option>
                <option value="2">Failed</option>
              </select>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <List className="text-blue-500 w-5 h-5" />
                Uploaded Logs
              </h3>
              <span className="text-sm text-gray-400">
                {selectedDeviceSn
                  ? `${filteredLogs.length} record(s)`
                  : "No device selected"}
              </span>
            </div>

            <div className="p-4">
              {!selectedDeviceSn ? (
                <div className="text-center py-12 text-gray-400">
                  <PlaneTakeoff className="w-8 h-8 mb-3 mx-auto text-gray-600" />
                  Select a device above to view its uploaded logs
                </div>
              ) : logsError ? (
                <div className="text-center py-8 text-red-400 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Failed to load logs: {(logsError as Error).message}
                </div>
              ) : logsLoading ? (
                <div className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading logs…
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Inbox className="w-8 h-8 mb-3 mx-auto text-gray-600" />
                  No uploaded logs found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <LogRow
                      key={log.logsId}
                      log={log}
                      onDelete={(logsId) => handleDelete(log.deviceSn, logsId)}
                      onCancel={(logsId) => handleCancel(log.deviceSn, logsId)}
                      isDeleting={isDeleting}
                      isCanceling={isCanceling}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
