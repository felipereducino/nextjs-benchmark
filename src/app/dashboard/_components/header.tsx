"use client";

import { useSidebar } from "./dashboard-layout-client";

export function Header() {
  const { toggle } = useSidebar();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Product Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Test B: Server + Client Wrappers</span>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          server-first
        </span>
      </div>
    </header>
  );
}
