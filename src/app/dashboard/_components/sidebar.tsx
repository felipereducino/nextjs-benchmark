"use client";

import { useSidebar } from "./dashboard-layout-client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Products", href: "/dashboard/products", icon: "📦" },
  { label: "Orders", href: "/dashboard/orders", icon: "🛒" },
  { label: "Customers", href: "/dashboard/customers", icon: "👥" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export function Sidebar() {
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
