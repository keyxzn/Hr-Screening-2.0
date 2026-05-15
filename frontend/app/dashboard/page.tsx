"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import { api, Candidate, ScreeningReport } from "@/lib/api";
import { Users, ShieldAlert, TrendingUp, Plus, ArrowRight, Clock, CheckCircle, Loader2, Activity, Shield, UserCheck, AlertTriangle, Zap } from "lucide-react";

type Row = Candidate & { report?: ScreeningReport };

const RISK_CATS = [
  { label:"Fraud / Scam",     key:"professional_risk", color:"#ef4444" },
  { label:"Toxic Language",   key:"toxic_language",    color:"#f97316" },
  { label:"Hate Speech",      key:"hate_speech",       color:"#eab308" },
  { label:"Explicit Content", key:"explicit_content",  color:"#8b5cf6" },
  { label:"Violence",         key:"violence",          color:"#dc2626" },
  { label:"Extremism",        key:"extremism",         color:"#0f172a" },
];

function DonutChart({ data }: { data: Record<string,number> }) {
  const segs = [
    { label:"Rendah",  val:data.low||0,      color:"#00c896" },
    { label:"Sedang",  val:data.medium||0,   color:"#f59e0b" },
    { label:"Tinggi",  val:data.high||0,     color:"#ef4444" },
    { label:"Kritis",  val:data.critical||0, color:"#7f1d1d" },
  ];
  const total = segs.reduce((s,x)=>s+x.val,0)||1;
  const r=15.9155, circ=2*Math.PI*r;
  let offset=0;
  const arcs = segs.map(s=>{
    const pct=s.val/total, dash=pct*circ, gap=circ-dash;
    const el=(
      <circle key={s.label} cx="21" cy="21" r={r} fill="none" stroke={s.color}
        strokeWidth="5" strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset*circ+circ*0.25}
        style={{transition:"stroke-dasharray 0.8s ease"}}/>
    );
    offset+=pct; return el;
  });
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full">
          <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border)" strokeWidth="5"/>
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-display font-extrabold" style={{color:"var(--text)"}}>{total}</span>
          <span style={{color:"var(--text3)"}} className="text-[9px] font-medium tracking-wide">TOTAL</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {segs.map(s=>(
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}/>
            <span style={{color:"var(--text2)"}} className="text-[12px] flex-1">{s.label}</span>
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:"var(--border)"}}>
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${(s.val/total)*100}%`,background:s.color}}/>
            </div>
            <span className="text-[11px] font-bold w-4 text-right" style={{color:"var(--text)"}}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [rows,setRows]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const c=await api.listCandidates();
        const w=await Promise.all(c.map(async x=>{try{return{...x,report:await api.getReport(x.id)}}catch{return x}}));
        setRows(w);
      } finally{setLoading(false);}
    })();
  },[]);

  const total=rows.length;
  const completed=rows.filter(r=>r.report?.status==="completed").length;
  const processing=rows.filter(r=>r.report?.status==="processing"||r.report?.status==="pending").length;
  const risk={
    low:rows.filter(r=>r.report?.overall_risk==="low").length,
    medium:rows.filter(r=>r.report?.overall_risk==="medium").length,
    high:rows.filter(r=>r.report?.overall_risk==="high").length,
    critical:rows.filter(r=>r.report?.overall_risk==="critical").length,
  };
  const highPct=total>0?Math.round(((risk.high+risk.critical)/total)*100):0;
  const recent=[...rows].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5);

  const STATS=[
    { label:"Total Kandidat",  val:total,               sub:`${processing} diproses`,      icon:Users,      grad:"135deg,#1e293b,#0f172a", glow:"none" },
    { label:"Selesai",         val:completed,           sub:"screening selesai",             icon:UserCheck,  grad:"135deg,#00c896,#00a07a", glow:"0 8px 24px rgba(0,200,150,0.4)" },
    { label:"High / Kritis",   val:risk.high+risk.critical, sub:`${highPct}% dari total`,  icon:ShieldAlert, grad:"135deg,#ef4444,#b91c1c", glow:"0 8px 24px rgba(239,68,68,0.4)" },
    { label:"Low Risk",        val:risk.low,            sub:"aman dilanjutkan",             icon:TrendingUp, grad:"135deg,#3b82f6,#2563eb", glow:"0 8px 24px rgba(59,130,246,0.4)" },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 animate-fade-up">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{color:"var(--accent)"}}>Overview</p>
            <h1 className="font-display text-[28px] font-extrabold tracking-tight" style={{color:"var(--text)"}}>Dashboard</h1>
            <p className="text-sm mt-1" style={{color:"var(--text3)"}}>Pantau aktivitas HR screening kandidat secara real-time</p>
          </div>
          <Link href="/candidates/add" className="btn-primary">
            <Plus size={14}/> Screening Baru
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}
          </div>
        ) : (<>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS.map((s,i)=>(
            <div key={s.label} className={`animate-fade-up stagger-${i+1} rounded-2xl p-5 relative overflow-hidden`}
              style={{background:`linear-gradient(${s.grad})`,boxShadow:s.glow}}>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5"/>
              <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-white/5"/>
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                  <s.icon size={15} className="text-white"/>
                </div>
                <p className="text-[30px] font-display font-extrabold text-white leading-none animate-count">{s.val}</p>
                <p className="text-[12px] font-semibold text-white/90 mt-1">{s.label}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-5 gap-5 mb-5">
          {/* Donut */}
          <div className="card lg:col-span-2 p-6 animate-fade-up stagger-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:"rgba(0,200,150,0.12)"}}>
                <Shield size={12} style={{color:"var(--accent)"}}/>
              </div>
              <h2 className="font-display text-[14px] font-bold" style={{color:"var(--text)"}}>Distribusi Risiko</h2>
            </div>
            {total===0?(
              <div className="flex flex-col items-center py-8" style={{color:"var(--text3)"}}>
                <Shield size={28} className="mb-2 opacity-30"/><p className="text-xs">Belum ada data</p>
              </div>
            ):<DonutChart data={risk}/>}
          </div>

          {/* Bar chart */}
          <div className="card lg:col-span-3 p-6 animate-fade-up stagger-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:"rgba(59,130,246,0.12)"}}>
                <Activity size={12} className="text-blue-500"/>
              </div>
              <h2 className="font-display text-[14px] font-bold" style={{color:"var(--text)"}}>Rata-rata Skor per Kategori</h2>
            </div>
            {completed===0?(
              <div className="flex flex-col items-center py-8" style={{color:"var(--text3)"}}>
                <Activity size={28} className="mb-2 opacity-30"/><p className="text-xs">Belum ada screening selesai</p>
              </div>
            ):(
              <div className="space-y-4">
                {RISK_CATS.map(cat=>{
                  const scores=rows.filter(r=>r.report?.risk_scores).map(r=>(r.report!.risk_scores as any)[cat.key]??0);
                  const avg=scores.length>0?Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length):0;
                  const tag=avg<25?"AMAN":avg<50?"SEDANG":"TINGGI";
                  const tagColor=avg<25?"#16a34a":avg<50?"#d97706":"#dc2626";
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-medium" style={{color:"var(--text2)"}}>{cat.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold" style={{color:"var(--text)"}}>{avg}%</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{color:tagColor,background:`${tagColor}18`}}>{tag}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--border)"}}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{width:`${avg}%`,background:cat.color}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Alert */}
        {(risk.high+risk.critical)>0&&(
          <div className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-3 animate-fade-up"
            style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)"}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(239,68,68,0.12)"}}>
              <AlertTriangle size={15} className="text-red-500"/>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-red-600">{risk.high+risk.critical} kandidat memerlukan perhatian segera</p>
              <p className="text-[11px] text-red-400/70 mt-0.5">Tinjau hasil screening sebelum melanjutkan proses rekrutmen.</p>
            </div>
            <Link href="/candidates" className="text-[12px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 flex-shrink-0 transition-colors">
              Tinjau <ArrowRight size={11}/>
            </Link>
          </div>
        )}

        {/* Recent */}
        <div className="card overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:"var(--border)"}}>
            <div className="flex items-center gap-2">
              <Clock size={13} style={{color:"var(--accent)"}}/>
              <h2 className="font-display text-[14px] font-bold" style={{color:"var(--text)"}}>Screening Terbaru</h2>
            </div>
            <Link href="/candidates" className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{color:"var(--accent)"}}>
              Lihat semua <ArrowRight size={11}/>
            </Link>
          </div>
          {recent.length===0?(
            <div className="text-center py-14" style={{color:"var(--text3)"}}>
              <Users size={28} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm font-medium">Belum ada kandidat</p>
              <Link href="/candidates/add" className="text-[12px] font-semibold mt-2 inline-block" style={{color:"var(--accent)"}}>Mulai screening pertama →</Link>
            </div>
          ):(
            <table className="w-full">
              <thead><tr style={{borderBottom:"1px solid var(--border)",background:"var(--bg3)"}}>
                {["Kandidat","Status","Risiko","Tanggal",""].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-wider" style={{color:"var(--text3)"}}>{h.toUpperCase()}</th>
                ))}
              </tr></thead>
              <tbody>
                {recent.map((row,i)=>(
                  <tr key={row.id} className="transition-colors" style={{borderBottom:"1px solid var(--border)"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="var(--bg3)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{background:"linear-gradient(135deg,var(--accent),#00a07a)"}}>
                          {row.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{color:"var(--text)"}}>{row.full_name}</p>
                          <p className="text-[11px]" style={{color:"var(--text3)"}}>{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {!row.report?<span className="text-[11px] font-medium px-2 py-1 rounded-lg" style={{background:"var(--bg3)",color:"var(--text3)"}}>Menunggu</span>
                      :row.report.status==="completed"?<span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(0,200,150,0.1)",color:"var(--accent)"}}>✓ Selesai</span>
                      :row.report.status==="failed"?<span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>✗ Gagal</span>
                      :<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(245,158,11,0.1)",color:"#f59e0b"}}><Loader2 size={9} className="animate-spin"/>Proses</span>}
                    </td>
                    <td className="px-5 py-3.5">{row.report?.overall_risk?<RiskBadge level={row.report.overall_risk}/>:<span style={{color:"var(--border)"}}>—</span>}</td>
                    <td className="px-5 py-3.5 text-[11px]" style={{color:"var(--text3)"}}>{new Date(row.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/candidates/${row.id}`} className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{color:"var(--accent)"}}>
                        Detail <ArrowRight size={10}/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        </>)}
      </div>
    </AppLayout>
  );
}