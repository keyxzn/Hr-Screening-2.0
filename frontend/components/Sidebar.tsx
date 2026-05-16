"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  Plus,
  Upload,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  X,
  AlignLeft,
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
      { label: "Semua Kandidat", href: "/candidates", icon: Users },
      { label: "Add Perorangan", href: "/candidates/add", icon: Plus },
      { label: "Add Bulk (Excel)", href: "/candidates/bulk", icon: Upload },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState<string[]>(["Kandidat"]);
  const [mob, setMob] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => { setMob(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = mob ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mob]);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isCollapsedDesktop = (isMobile: boolean) => collapsed && !isMobile;

  const Body = ({ isMobile = false }: { isMobile?: boolean }) => {
    const col = isCollapsedDesktop(isMobile);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{
          padding: col ? "20px 0" : "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: col ? "center" : "space-between",
          gap: 10,
          flexShrink: 0,
        }}>
          {!col && (
            <Link href="/dashboard" onClick={() => setMob(false)} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1, minWidth: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: "linear-gradient(135deg, #00e8ad 0%, #00b88a 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 6px 18px rgba(0,232,173,0.28)",
                position: "relative", overflow: "hidden",
              }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#04130f", letterSpacing: "-0.04em" }}>HR</span>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 60%)", borderRadius: "inherit" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "-0.05em", color: "#f1f5f9", lineHeight: 1.15, whiteSpace: "nowrap" }}>
                  HR<span style={{ color: "#00e8ad" }}>Check</span>
                </p>
                <p style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.6)", marginTop: 3, fontWeight: 600, whiteSpace: "nowrap" }}>
                  AI Recruitment
                </p>
              </div>
            </Link>
          )}

          {!isMobile ? (
            <button onClick={() => setCollapsed(c => !c)} style={iconBtnStyle} onMouseEnter={e => iconBtnHover(e, true)} onMouseLeave={e => iconBtnHover(e, false)}>
              <AlignLeft size={15} />
            </button>
          ) : (
            <button onClick={() => setMob(false)} style={iconBtnStyle} onMouseEnter={e => iconBtnHover(e, true)} onMouseLeave={e => iconBtnHover(e, false)}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: col ? "12px 8px" : "12px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
          {NAV.map((item) => {
            if (item.href) {
              const active = path === item.href;
              return (
                <div key={item.href} style={{ position: "relative" }} onMouseEnter={() => col && setTooltip(item.label)} onMouseLeave={() => setTooltip(null)}>
                  <Link href={item.href} onClick={() => setMob(false)} style={navItemStyle(active, col)}>
                    {active && <ActiveBar />}
                    <item.icon size={17} style={{ color: active ? "#00e8ad" : "rgba(148,163,184,0.65)", flexShrink: 0 }} />
                    {!col && <span style={navTextStyle(active)}>{item.label}</span>}
                  </Link>
                  {col && tooltip === item.label && <Tooltip label={item.label} />}
                </div>
              );
            }

            const isGrpOpen = open.includes(item.label);
            const anyActive = item.children?.some(c => path.startsWith(c.href));

            return (
              <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}
                onMouseEnter={() => col && setTooltip(item.label)} onMouseLeave={() => setTooltip(null)}>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setOpen(o => o.includes(item.label) ? o.filter(x => x !== item.label) : [...o, item.label])}
                    style={{ ...navItemStyle(!!anyActive, col), border: "none" }}>
                    <item.icon size={17} style={{ color: anyActive ? "#00e8ad" : "rgba(148,163,184,0.65)", flexShrink: 0 }} />
                    {!col && (
                      <>
                        <span style={{ ...navTextStyle(!!anyActive), flex: 1, textAlign: "left" }}>{item.label}</span>
                        <ChevronDown size={13} style={{ color: "rgba(148,163,184,0.45)", transform: isGrpOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.22s ease" }} />
                      </>
                    )}
                  </button>
                  {col && tooltip === item.label && <Tooltip label={item.label} />}
                </div>

                {!col && isGrpOpen && (
                  <div style={{ marginLeft: 13, paddingLeft: 11, borderLeft: "1px solid rgba(0,232,173,0.14)", display: "flex", flexDirection: "column", gap: 1, marginBottom: 4 }}>
                    {item.children?.map(c => {
                      const ca = path === c.href;
                      return (
                        <Link key={c.href} href={c.href} onClick={() => setMob(false)} style={subItemStyle(ca)}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: ca ? "#00e8ad" : "rgba(148,163,184,0.3)", boxShadow: ca ? "0 0 6px rgba(0,232,173,0.55)" : "none", transition: "all 0.15s" }} />
                          <span style={{ fontSize: 12.5, fontWeight: ca ? 600 : 400, color: ca ? "#00e8ad" : "rgba(148,163,184,0.6)", fontFamily: "'DM Sans',sans-serif" }}>{c.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <div style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 6 }}
            onMouseEnter={() => col && setTooltip("theme")} onMouseLeave={() => setTooltip(null)}>
            <div style={{ position: "relative" }}>
              <button onClick={toggle} style={{ ...navItemStyle(false, col), border: "none" }}>
                {dark
                  ? <Sun size={17} style={{ color: "#fbbf24", flexShrink: 0 }} />
                  : <Moon size={17} style={{ color: "rgba(148,163,184,0.65)", flexShrink: 0 }} />}
                {!col && <span style={navTextStyle(false)}>{dark ? "Light Mode" : "Dark Mode"}</span>}
              </button>
              {col && tooltip === "theme" && <Tooltip label={dark ? "Light Mode" : "Dark Mode"} />}
            </div>
          </div>
        </nav>

        {/* ── Footer ── */}
        <div style={{ padding: col ? "10px 8px" : "10px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {!col ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
              <Avatar initials={initials} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>{user?.name}</p>
                <p style={{ fontSize: 10, color: "rgba(148,163,184,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>{user?.role || "HR Manager"}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}
              onMouseEnter={() => setTooltip("user")} onMouseLeave={() => setTooltip(null)}>
              <div style={{ position: "relative" }}>
                <Avatar initials={initials} />
                {tooltip === "user" && <Tooltip label={user?.name || "User"} />}
              </div>
            </div>
          )}

          <div style={{ position: "relative" }} onMouseEnter={() => col && setTooltip("logout")} onMouseLeave={() => setTooltip(null)}>
            <button onClick={logout} style={logoutBtnStyle(col)}>
              <LogOut size={14} style={{ flexShrink: 0 }} />
              {!col && <span>Keluar</span>}
            </button>
            {col && tooltip === "logout" && <Tooltip label="Keluar" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex" style={{
        background: "linear-gradient(180deg,#080d1a 0%,#0d1220 100%)",
        width: collapsed ? 66 : 246,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        flexDirection: "column",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        zIndex: 30,
      }}>
        <Body />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden" style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56,
        background: "linear-gradient(180deg,#080d1a 0%,#0d1220 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}>

        <button onClick={() => setMob(true)} style={{
          height: 34, paddingInline: 14,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.05)",
          color: "rgba(148,163,184,0.8)",
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.02em",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#f1f5f9"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(148,163,184,0.8)"; }}
        >
          Menu
        </button>
      </div>

      {/* Mobile drawer */}
      {mob && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }} onClick={() => setMob(false)} />
          <div style={{ position: "relative", width: 264, maxWidth: "85vw", background: "linear-gradient(180deg,#080d1a 0%,#0d1220 100%)", height: "100%", borderRight: "1px solid rgba(255,255,255,0.07)", animation: "slideR 0.25s cubic-bezier(0.22,1,0.36,1)", boxShadow: "4px 0 32px rgba(0,0,0,0.5)" }}>
            <Body isMobile />
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ─────────────────────────── */

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: "linear-gradient(135deg,#00e8ad 0%,#00a07a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: "#04130f", boxShadow: "0 4px 12px rgba(0,232,173,0.2)" }}>
      {initials}
    </div>
  );
}

function ActiveBar() {
  return (
    <div style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 3, borderRadius: "0 3px 3px 0", background: "linear-gradient(180deg,#00e8ad,#00b88a)", boxShadow: "0 0 8px rgba(0,232,173,0.5)" }} />
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <div style={{ position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)", background: "#1a2540", color: "#f1f5f9", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.35)", zIndex: 100 }}>
      {label}
    </div>
  );
}

/* ── Style helpers ─────────────────────────── */

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.04)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "rgba(148,163,184,0.65)",
  cursor: "pointer", transition: "all 0.18s",
  flexShrink: 0,
};

function iconBtnHover(e: React.MouseEvent<HTMLButtonElement>, enter: boolean) {
  e.currentTarget.style.background = enter ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)";
  e.currentTarget.style.color = enter ? "#f1f5f9" : "rgba(148,163,184,0.65)";
}

function navItemStyle(active: boolean, collapsed: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: collapsed ? 0 : 10,
    padding: collapsed ? "10px" : "9px 10px",
    borderRadius: 13,
    textDecoration: "none",
    justifyContent: collapsed ? "center" : "flex-start",
    transition: "all 0.16s ease",
    position: "relative",
    width: "100%",
    background: active ? "rgba(0,232,173,0.12)" : "transparent",
    border: active ? "1px solid rgba(0,232,173,0.18)" : "1px solid transparent",
    cursor: "pointer",
  };
}

function navTextStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 13.5,
    fontWeight: active ? 700 : 500,
    color: active ? "#f1f5f9" : "rgba(148,163,184,0.8)",
    fontFamily: "'DM Sans',sans-serif",
    letterSpacing: "-0.01em",
  };
}

function subItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 9,
    padding: "7px 10px", borderRadius: 9,
    textDecoration: "none", transition: "all 0.14s ease",
    background: active ? "rgba(0,232,173,0.08)" : "transparent",
  };
}

function logoutBtnStyle(collapsed: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center",
    gap: collapsed ? 0 : 8,
    width: "100%",
    padding: collapsed ? "9px" : "8px 12px",
    borderRadius: 11,
    background: "transparent",
    border: "1px solid transparent",
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(248,113,113,0.55)",
    transition: "all 0.16s",
    justifyContent: collapsed ? "center" : "flex-start",
  };
}