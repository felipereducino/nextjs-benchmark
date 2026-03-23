"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Products", href: "/dashboard/products", icon: "📦" },
  { label: "Orders", href: "/dashboard/orders", icon: "🛒" },
  { label: "Customers", href: "/dashboard/customers", icon: "👥" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

function Sidebar() {
  const { isOpen } = useSidebar();

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="p-4 border-b border-gray-700">
        <h2 className={`font-bold text-lg ${!isOpen && "hidden"}`}>
          PerfTest App
        </h2>
        {!isOpen && <span className="text-xl">⚡</span>}
      </div>
      <nav className="flex-1 p-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            {isOpen && <span className="text-sm">{item.label}</span>}
          </a>
        ))}
      </nav>
      <div className={`p-4 border-t border-gray-700 ${!isOpen && "hidden"}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            F
          </div>
          <div>
            <p className="text-sm font-medium">Felipe R.</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header() {
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
        <span className="text-sm text-gray-500">Test A: All Client</span>
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          use client everywhere
        </span>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
