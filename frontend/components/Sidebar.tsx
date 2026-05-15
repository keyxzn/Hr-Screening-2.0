"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import { LayoutDashboard, Users, Plus, Upload, LogOut, ChevronDown, ChevronRight, Menu, X, Sun, Moon, Shield } from "lucide-react";

const NAV = [
  { label:"Dashboard", href:"/dashboard", icon:LayoutDashboard },
  { label:"Kandidat", icon:Users, children:[
    { label:"Semua Kandidat", href:"/candidates", icon:Users },
    { label:"Add Perorangan",  href:"/candidates/add", icon:Plus },
    { label:"Add Bulk (Excel)", href:"/candidates/bulk", icon:Upload },
  ]},
];

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState<string[]>(["Kandidat"]);
  const [mob, setMob]   = useState(false);

  const s = {
    sidebar:  "flex flex-col h-screen sticky top-0 w-[220px] flex-shrink-0",
    bg:       "bg-[var(--sidebar)]",
    logo:     "px-5 py-5 border-b border-white/5",
    nav:      "flex-1 px-3 py-4 space-y-0.5 overflow-y-auto",
    link:     (active:boolean) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${active ? "bg-[var(--accent)]/15 text-[var(--accent)] font-semibold" : "text-[var(--sidebar-text)] hover:text-white hover:bg-white/5"}`,
    sub:      (active:boolean) => `flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${active ? "text-[var(--accent)] bg-[var(--accent)]/10" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`,
    subWrap:  "ml-5 mt-0.5 pl-3 border-l border-white/8 space-y-0.5",
    footer:   "px-3 py-4 border-t border-white/5",
    user:     "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-2",
    logout:   "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all w-full cursor-pointer",
  };

  const Body = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={s.logo}>
        <Link href="/dashboard" className="flex items-center gap-3" onClick={()=>setMob(false)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-teal-400 flex items-center justify-center shadow-lg">
            <Shield size={14} className="text-white"/>
          </div>
          <div>
            <p className="font-display font-extrabold text-white text-[15px] leading-none tracking-tight">HR<span style={{color:"var(--accent)"}}>Check</span></p>
            <p className="text-[9px] text-slate-600 tracking-[0.15em] uppercase mt-0.5">Screening AI</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className={s.nav}>
        {NAV.map(item => {
          if (item.href) {
            return (
              <Link key={item.href} href={item.href} onClick={()=>setMob(false)} className={s.link(path===item.href)}>
                <item.icon size={15}/> {item.label}
              </Link>
            );
          }
          const isOpen = open.includes(item.label);
          const anyActive = item.children?.some(c => path.startsWith(c.href));
          return (
            <div key={item.label}>
              <div onClick={()=>setOpen(o=>o.includes(item.label)?o.filter(x=>x!==item.label):[...o,item.label])} className={s.link(!!anyActive)}>
                <item.icon size={15}/>
                <span className="flex-1">{item.label}</span>
                {isOpen ? <ChevronDown size={12} className="opacity-50"/> : <ChevronRight size={12} className="opacity-50"/>}
              </div>
              {isOpen && (
                <div className={s.subWrap}>
                  {item.children?.map(c => (
                    <Link key={c.href} href={c.href} onClick={()=>setMob(false)} className={s.sub(path===c.href)}>
                      <c.icon size={11}/> {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Theme toggle */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <button onClick={toggle} className={s.link(false)}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className={s.footer}>
        <div className={s.user}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-teal-400 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()??"?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-600 truncate">{user?.role?.toUpperCase()}</p>
          </div>
        </div>
        <button onClick={logout} className={s.logout}><LogOut size={13}/> Keluar</button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex flex-col ${s.bg} ${s.sidebar}`}><Body/></aside>
      {/* Mobile */}
      <div className={`lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 ${s.bg} border-b border-white/5`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--accent)] to-teal-400 flex items-center justify-center"><Shield size={13} className="text-white"/></div>
          <span className="font-display font-extrabold text-white text-sm">HR<span style={{color:"var(--accent)"}}>Check</span></span>
        </Link>
        <button onClick={()=>setMob(true)} className="text-slate-400 hover:text-white"><Menu size={20}/></button>
      </div>
      {mob && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setMob(false)}/>
          <div className={`relative w-[220px] ${s.bg} h-full`}>
            <button onClick={()=>setMob(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={16}/></button>
            <Body/>
          </div>
        </div>
      )}
    </>
  );
}