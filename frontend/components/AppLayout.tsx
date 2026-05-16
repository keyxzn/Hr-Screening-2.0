"use client";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Mobile topbar — rendered by Sidebar, sits above main on small screens */}
      {/* Desktop: flex row with sticky sidebar + scrollable main */}
      <div className="lg:flex lg:min-h-screen">
        <Sidebar />
        <main
          className="flex-1 min-w-0 overflow-x-hidden"
          style={{ background: "var(--bg)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}