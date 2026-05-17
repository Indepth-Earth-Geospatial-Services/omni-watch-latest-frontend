"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/features/metrics/stat-card";
import { useWorkspaceUsers, useUpdateUser } from "@/hooks/useUser";
import type { DJIUser, UpdateUserRequest } from "@/lib/types";

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-red-500", "bg-orange-500", "bg-pink-500", "bg-teal-500",
];

function getInitials(username: string | undefined | null): string {
  if (!username) return "??";
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.substring(0, 2).toUpperCase();
}

function getAvatarColor(userId: string | undefined | null): string {
  if (!userId) return AVATAR_COLORS[0];
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [editTarget, setEditTarget] = useState<DJIUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editUserType, setEditUserType] = useState("");

  const { data, isLoading, error } = useWorkspaceUsers({
    page: currentPage,
    page_size: PAGE_SIZE,
  });
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const users = data?.list ?? [];
  const totalUsers = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const mqttEnabledCount = users.filter((u) => u.mqttUsername).length;

  const userTypes = Array.from(new Set(users.map((u) => u.userType).filter((t) => !!t?.trim())));

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || user.userType === typeFilter;
    return matchesSearch && matchesType;
  });

  function openEdit(user: DJIUser) {
    setEditTarget(user);
    setEditUsername(user.username);
    setEditUserType(user.userType);
  }

  function closeEdit() {
    setEditTarget(null);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const payload: UpdateUserRequest = {
      username: editUsername,
      userType: editUserType,
    };
    updateUser({ userId: editTarget.userId, payload }, { onSuccess: closeEdit });
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 2),
    Math.min(totalPages, currentPage + 1)
  );

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="User Management" subtitle="">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Users"
              value={isLoading ? "..." : String(totalUsers)}
              icon="fas fa-users"
              color="blue"
            />
            <StatCard
              title="MQTT Enabled"
              value={isLoading ? "..." : String(mqttEnabledCount)}
              icon="fas fa-satellite-dish"
              color="green"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-card p-4 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-filter text-blue-500"></i>
              <h3 className="text-lg font-semibold">Filters & Search</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {userTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {totalUsers} users found
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-users text-blue-500 mr-2"></i>
                <span>System Users</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              {error ? (
                <div className="p-8 text-center text-red-400">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Failed to load users: {(error as Error).message}
                </div>
              ) : isLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Loading users...
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        User
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        Workspace
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        MQTT
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => (
                        <tr key={user.userId ?? `user-${idx}`} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 ${getAvatarColor(user.userId)} rounded-full flex items-center justify-center`}
                              >
                                <span className="text-white text-sm font-medium">
                                  {getInitials(user.username)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-100">
                                  {user.username}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {user.userId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              {user.userType || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {user.workspaceName || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {user.mqttUsername ? (
                              <span className="text-xs bg-green-700 text-green-200 px-2 py-1 rounded">
                                Configured
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                                None
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(user.createTime)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openEdit(user)}
                              className="p-1 hover:bg-gray-600 rounded"
                              title="Edit user"
                            >
                              <i className="fas fa-edit text-blue-400 text-sm"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && !error && totalUsers > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing{" "}
                  {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalUsers)}–
                  {Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers}{" "}
                  users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? "bg-blue-500 text-white"
                          : "border border-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        {editTarget && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg border border-gray-800 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit User</h3>
                <button
                  onClick={closeEdit}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <i className="fas fa-times text-gray-400"></i>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    User Type
                  </label>
                  <input
                    type="text"
                    value={editUserType}
                    onChange={(e) => setEditUserType(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </MainLayout>
    </div>
  );
}
