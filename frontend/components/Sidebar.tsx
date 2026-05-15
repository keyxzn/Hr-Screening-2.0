"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import {
  LayoutDashboard, Users, Plus, Upload,
  LogOut, ChevronDown, ChevronRight,
  Menu, X, Sun, Moon, Zap
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kandidat", icon: Users, children: [
    { label: "Semua Kandidat",  href: "/candidates",      icon: Users  },
    { label: "Add Perorangan",  href: "/candidates/add",  icon: Plus   },
    { label: "Add Bulk (Excel)",href: "/candidates/bulk", icon: Upload },
  ]},
];

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState<string[]>(["Kandidat"]);
  const [mob, setMob]   = useState(false);

  const navLink = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer select-none ${
      active
        ? "bg-[var(--accent)] text-[#061814] shadow-sm"
        : "text-[var(--sb-text)] hover:text-white hover:bg-white/[0.07]"
    }`;

  const subLink = (active: boolean) =>
    `flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
      active
        ? "text-[var(--accent)] bg-[var(--accent-d)]"
        : "text-[var(--sb-muted)] hover:text-[var(--sb-text)] hover:bg-white/[0.05]"
    }`;

  const Body = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Logo */}
      <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid var(--sb-bdr)" }}>
        <Link href="/dashboard" onClick={() => setMob(false)} style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
          <div style={{
            width:38, height:38, borderRadius:12, flexShrink:0,
            background:"linear-gradient(135deg, var(--accent) 0%, #00a07a 100%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px var(--accent-g)",
          }}>
            <Zap size={17} style={{ color:"#061814" }} />
          </div>
          <div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>
              HR<span style={{ color:"var(--accent)" }}>Check</span>
            </p>
            <p style={{ fontSize:9, color:"var(--sb-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginTop:3 }}>
              Screening AI
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"14px 10px", overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
        {NAV.map(item => {
          if (item.href) {
            return (
              <Link key={item.href} href={item.href} onClick={() => setMob(false)} className={navLink(path === item.href)}>
                <item.icon size={15} /> {item.label}
              </Link>
            );
          }
          const isOpen = open.includes(item.label);
          const anyActive = item.children?.some(c => path.startsWith(c.href));
          return (
            <div key={item.label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <div onClick={() => setOpen(o => o.includes(item.label) ? o.filter(x => x !== item.label) : [...o, item.label])}
                className={navLink(!!anyActive)}>
                <item.icon size={15} />
                <span style={{ flex:1 }}>{item.label}</span>
                {isOpen
                  ? <ChevronDown  size={12} style={{ opacity:0.4 }} />
                  : <ChevronRight size={12} style={{ opacity:0.4 }} />}
              </div>
              {isOpen && (
                <div style={{ marginLeft:18, paddingLeft:12, borderLeft:"1px solid var(--sb-bdr)", display:"flex", flexDirection:"column", gap:1, marginBottom:4 }}>
                  {item.children?.map(c => (
                    <Link key={c.href} href={c.href} onClick={() => setMob(false)} className={subLink(path === c.href)}>
                      <c.icon size={11} /> {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Theme toggle */}
        <div style={{ marginTop:"auto", paddingTop:12, borderTop:"1px solid var(--sb-bdr)" }}>
          <button onClick={toggle} className={navLink(false)} style={{ width:"100%", border:"none", background:"transparent" }}>
            {dark
              ? <><Sun  size={15} style={{ color:"#fbbf24" }} /><span style={{ color:"var(--sb-text)" }}>Light Mode</span></>
              : <><Moon size={15} style={{ color:"#94a3b8" }} /><span style={{ color:"var(--sb-text)" }}>Dark Mode</span></>
            }
          </button>
        </div>
      </nav>

      {/* Footer / User */}
      <div style={{ padding:"12px 10px", borderTop:"1px solid var(--sb-bdr)" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"10px 12px", borderRadius:14, marginBottom:6,
          background:"rgba(255,255,255,0.04)",
        }}>
          <div style={{
            width:32, height:32, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,var(--accent),#00a07a)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, color:"#061814",
          }}>
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12.5, fontWeight:700, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
            <p style={{ fontSize:9.5, color:"var(--sb-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:1 }}>{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} style={{
          display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"8px 12px", borderRadius:10, background:"transparent",
          border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
          fontSize:12, fontWeight:600, color:"rgba(248,113,113,0.55)", transition:"all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color="#f87171"; e.currentTarget.style.background="rgba(248,113,113,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color="rgba(248,113,113,0.55)"; e.currentTarget.style.background="transparent"; }}
        >
          <LogOut size={12} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside style={{
        background:"var(--sidebar)", width:230, flexShrink:0,
        height:"100vh", position:"sticky", top:0,
        display:"flex", flexDirection:"column",
      }} className="hidden lg:flex">
        <Body />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden" style={{
        position:"sticky", top:0, zIndex:40,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px", height:56,
        background:"var(--sidebar)", borderBottom:"1px solid var(--sb-bdr)",
      }}>
        <Link href="/dashboard" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,var(--accent),#00a07a)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={13} style={{ color:"#061814" }} />
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>
            HR<span style={{ color:"var(--accent)" }}>Check</span>
          </span>
        </Link>
        <button onClick={() => setMob(true)} style={{ color:"#64748b", background:"none", border:"none", cursor:"pointer" }}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mob && (
        <div className="lg:hidden" style={{ position:"fixed", inset:0, zIndex:50, display:"flex" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)" }} onClick={() => setMob(false)} />
          <div style={{ position:"relative", width:230, background:"var(--sidebar)", height:"100%" }}>
            <button onClick={() => setMob(false)} style={{ position:"absolute", top:14, right:14, color:"#64748b", background:"none", border:"none", cursor:"pointer" }}>
              <X size={16} />
            </button>
            <Body />
          </div>
        </div>
      )}
    </>
  );
}
