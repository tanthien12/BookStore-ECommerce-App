import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";

export default function AdminLayout() {
    return (
        <div className="flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold">Admin Dashboard</h2>

                    <div className="flex items-center gap-4">
                        {/* Search bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring focus:border-blue-500"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        </div>

                        {/* Notification */}
                        <button className="relative p-2 hover:bg-gray-100 rounded-full">
                            🔔
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
                                3
                            </span>
                        </button>

                        {/* User Avatar */}
                        <div className="flex items-center gap-2">
                            <img
                                src="https://i.pravatar.cc/32"
                                alt="user"
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm font-medium">Admin</span>
                        </div>
                    </div>
                </header>

                {/* Nội dung trang (render theo route con) */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
