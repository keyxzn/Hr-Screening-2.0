"use client";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg)", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Mobile topbar — rendered by Sidebar, sits above main on small screens */}
      {/* Desktop: flex row with sticky sidebar + scrollable main */}
      <div className="lg:flex" style={{ flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main
          className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto"
          style={{ background: "var(--bg)", height: "100%" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}