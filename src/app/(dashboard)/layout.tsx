import { DashboardLayoutClient } from "./_components/dashboard-layout-client";
import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
