"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  Plus,
  Upload,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Zap,
} from "lucide-react";

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Kandidat",
    icon: Users,

    children: [
      {
        label: "Semua Kandidat",
        href: "/candidates",
        icon: Users,
      },

      {
        label: "Add Perorangan",
        href: "/candidates/add",
        icon: Plus,
      },

      {
        label: "Add Bulk (Excel)",
        href: "/candidates/bulk",
        icon: Upload,
      },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();

  const { user, logout } = useAuth();

  const { dark, toggle } = useTheme();

  const [open, setOpen] = useState<string[]>(["Kandidat"]);

  const [mob, setMob] = useState(false);

  const navLink = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 cursor-pointer select-none ${
      active
        ? "bg-[var(--accent)] text-[#061814] shadow-lg"
        : "text-[var(--sb-text)] hover:text-white hover:bg-white/[0.06] hover:translate-x-[2px]"
    }`;

  const subLink = (active: boolean) =>
    `flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all ${
      active
        ? "text-[var(--accent)] bg-[var(--accent-d)]"
        : "text-[var(--sb-muted)] hover:text-[var(--sb-text)] hover:bg-white/[0.05]"
    }`;

  const Body = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--sb-bdr)",
        }}
      >
        <Link
          href="/dashboard"
          onClick={() => setMob(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background:
                "linear-gradient(135deg,#00d2a0,#00b894)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 10px 30px rgba(0,210,160,0.28)",
              flexShrink: 0,
            }}
          >
            <Zap size={22} color="#04130f" />
          </div>

          <div>
            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.05em",
                color: "white",
                lineHeight: 1,
              }}
            >
              HR<span style={{ color: "#00d2a0" }}>Check</span>
            </h1>

            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginTop: 5,
                fontWeight: 600,
              }}
            >
              AI Recruitment
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "16px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {NAV.map((item) => {
          if (item.href) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMob(false)}
                className={navLink(path === item.href)}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          }

          const isOpen = open.includes(item.label);

          const anyActive = item.children?.some((c) =>
            path.startsWith(c.href)
          );

          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                onClick={() =>
                  setOpen((o) =>
                    o.includes(item.label)
                      ? o.filter((x) => x !== item.label)
                      : [...o, item.label]
                  )
                }
                className={navLink(!!anyActive)}
              >
                <item.icon size={16} />

                <span style={{ flex: 1 }}>
                  {item.label}
                </span>

                {isOpen ? (
                  <ChevronDown
                    size={14}
                    style={{ opacity: 0.5 }}
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    style={{ opacity: 0.5 }}
                  />
                )}
              </div>

              {isOpen && (
                <div
                  style={{
                    marginLeft: 20,
                    paddingLeft: 14,
                    borderLeft:
                      "1px solid var(--sb-bdr)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  {item.children?.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setMob(false)}
                      className={subLink(path === c.href)}
                    >
                      <c.icon size={12} />

                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Theme Toggle */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 14,
            borderTop: "1px solid var(--sb-bdr)",
          }}
        >
          <button
            onClick={toggle}
            className={navLink(false)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
            }}
          >
            {dark ? (
              <>
                <Sun
                  size={16}
                  style={{ color: "#fbbf24" }}
                />

                <span style={{ color: "var(--sb-text)" }}>
                  Light Mode
                </span>
              </>
            ) : (
              <>
                <Moon
                  size={16}
                  style={{ color: "#94a3b8" }}
                />

                <span style={{ color: "var(--sb-text)" }}>
                  Dark Mode
                </span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "14px 12px",
          borderTop: "1px solid var(--sb-bdr)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px",
            borderRadius: 18,
            marginBottom: 10,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",
            border:
              "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              flexShrink: 0,
              background:
                "linear-gradient(135deg,var(--accent),#00a07a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "#061814",
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ??
              "?"}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#f8fafc",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </p>

            <p
              style={{
                fontSize: 10,
                color: "#94a3b8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {user?.role || "HR Manager"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 14,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            color: "rgba(248,113,113,0.65)",
            transition: "all .2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color =
              "#f87171";

            e.currentTarget.style.background =
              "rgba(248,113,113,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "rgba(248,113,113,0.65)";

            e.currentTarget.style.background =
              "transparent";
          }}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        style={{
          background:
            "linear-gradient(180deg,#0f172a 0%, #111827 100%)",

          width: 260,

          flexShrink: 0,

          height: "100vh",

          position: "sticky",

          top: 0,

          display: "flex",

          backdropFilter:"blur(16px)",

          borderRight:"1px solid rgba(255,255,255,0.05)",

          flexDirection: "column",
        }}
        >
        <Body />
      </aside>

      {/* Mobile Topbar */}
      <div
        className="lg:hidden"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 60,
          background:
            "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background:
                "linear-gradient(135deg,var(--accent),#00a07a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap
              size={15}
              style={{ color: "#061814" }}
            />
          </div>
        </Link>

        <button
          onClick={() => setMob(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border:
              "1px solid rgba(255,255,255,0.06)",
            background:
              "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mob && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setMob(false)}
          />

          <div
            style={{
              position: "relative",
              width: 260,
              background:
                "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
              height: "100%",
              borderRight:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => setMob(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#94a3b8",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>

            <Body />
          </div>
        </div>
      )}
    </>
  );
}