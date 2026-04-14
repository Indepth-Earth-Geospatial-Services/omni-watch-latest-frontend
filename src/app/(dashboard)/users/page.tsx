"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/features/metrics/stat-card";

interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "COMMANDER" | "ANALYST" | "OPERATOR";
  status: "active" | "inactive";
  lastLogin: string;
  created: string;
  initials: string;
  avatarColor: string;
}

const sampleUsers: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@isr.mil",
    role: "ADMIN",
    status: "active",
    lastLogin: "2 hours ago",
    created: "Jan 15, 2025",
    initials: "JD",
    avatarColor: "bg-blue-500",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@isr.mil",
    role: "COMMANDER",
    status: "active",
    lastLogin: "1 day ago",
    created: "Jan 10, 2025",
    initials: "JS",
    avatarColor: "bg-green-500",
  },
  {
    id: 3,
    name: "Mike Brown",
    email: "mike.brown@isr.mil",
    role: "ANALYST",
    status: "active",
    lastLogin: "3 hours ago",
    created: "Dec 22, 2024",
    initials: "MB",
    avatarColor: "bg-yellow-500",
  },
  {
    id: 4,
    name: "Lisa Wilson",
    email: "lisa.wilson@isr.mil",
    role: "OPERATOR",
    status: "inactive",
    lastLogin: "2 weeks ago",
    created: "Nov 18, 2024",
    initials: "LW",
    avatarColor: "bg-orange-500",
  },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userActive, setUserActive] = useState(true);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500";
      case "COMMANDER":
        return "bg-purple-500";
      case "ANALYST":
        return "bg-blue-500";
      case "OPERATOR":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-500" : "bg-red-500";
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name: userName,
      email: userEmail,
      role: userRole,
      password: userPassword,
      active: userActive,
    };

    console.log("Adding user:", formData);
    alert("User added successfully!");

    // Reset form
    setShowAddModal(false);
    setUserName("");
    setUserEmail("");
    setUserRole("");
    setUserPassword("");
    setUserActive(true);
  };

  const filteredUsers = sampleUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="User Management" subtitle="">
        <div className="space-y-6">
          {/* Add User Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>Add New User
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value="24"
              icon="fas fa-users"
              color="blue"
            />
            <StatCard
              title="Active Users"
              value="21"
              icon="fas fa-user-check"
              color="green"
            />
            <StatCard
              title="Inactive Users"
              value="3"
              icon="fas fa-user-times"
              color="orange"
            />
            <StatCard
              title="Recent Logins"
              value="12"
              icon="fas fa-clock"
              color="purple"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-card p-4 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-filter text-blue-500"></i>
              <h3 className="text-lg font-semibold">Filters & Search</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="COMMANDER">Commander</option>
                <option value="ANALYST">Analyst</option>
                <option value="OPERATOR">Operator</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex items-center justify-end">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  24 users found
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
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-300">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-300">
                      Last Login
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 ${user.avatarColor} rounded-full flex items-center justify-center`}
                          >
                            <span className="text-white text-sm font-medium">
                              {user.initials}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-100">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs ${getRoleColor(
                            user.role
                          )} text-white px-2 py-1 rounded`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs ${getStatusColor(
                            user.status
                          )} text-white px-2 py-1 rounded`}
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {user.lastLogin}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {user.created}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-gray-600 rounded">
                            <i className="fas fa-edit text-blue-400 text-sm"></i>
                          </button>
                          <button className="p-1 hover:bg-gray-600 rounded">
                            <i className="fas fa-trash text-red-400 text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Showing 1 to 4 of 24 users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === 1
                      ? "bg-blue-500 text-white"
                      : "border border-gray-600 hover:bg-gray-700"
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === 2
                      ? "bg-blue-500 text-white"
                      : "border border-gray-600 hover:bg-gray-700"
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === 3
                      ? "bg-blue-500 text-white"
                      : "border border-gray-600 hover:bg-gray-700"
                  }`}
                >
                  3
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                  disabled={currentPage === 3}
                  className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg border border-gray-800 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <i className="fas fa-times text-gray-400"></i>
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="COMMANDER">Commander</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="OPERATOR">Operator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={userActive}
                    onChange={(e) => setUserActive(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="userActive" className="text-sm text-gray-300">
                    Active User
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Add User
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