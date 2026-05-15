"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import { api, Candidate, ScreeningReport } from "@/lib/api";
import { Plus, Upload, Trash2, Eye, Loader2, Users, Search, UserPlus, FileSpreadsheet, ChevronRight } from "lucide-react";

type Row = Candidate & { report?: ScreeningReport };

export default function CandidatesPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");

  async function load() {
    try {
      const c = await api.listCandidates();
      const w = await Promise.all(c.map(async x=>{try{return{...x,report:await api.getReport(x.id)}}catch{return x}}));
      setRows(w);
    } finally { setLoading(false); }
  }
  useEffect(()=>{load();},[]);

  async function del(id:string) {
    if(!confirm("Hapus kandidat ini beserta semua datanya?")) return;
    await api.deleteCandidate(id);
    setRows(r=>r.filter(x=>x.id!==id));
  }

  const filtered = rows.filter(r=>{
    const ms = r.full_name.toLowerCase().includes(search.toLowerCase())||r.email.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all"||r.report?.overall_risk===filter||(filter==="processing"&&(r.report?.status==="processing"||r.report?.status==="pending"));
    return ms&&mf;
  });

  const counts = {
    all: rows.length,
    low: rows.filter(r=>r.report?.overall_risk==="low").length,
    medium: rows.filter(r=>r.report?.overall_risk==="medium").length,
    high: rows.filter(r=>r.report?.overall_risk==="high"||r.report?.overall_risk==="critical").length,
    processing: rows.filter(r=>r.report?.status==="processing"||r.report?.status==="pending").length,
  };

  const FILTERS = [
    { key:"all",        label:"Semua",     count:counts.all,        dot:"" },
    { key:"low",        label:"Low Risk",  count:counts.low,        dot:"#22c55e" },
    { key:"medium",     label:"Sedang",    count:counts.medium,     dot:"#f59e0b" },
    { key:"high",       label:"Tinggi",    count:counts.high,       dot:"#ef4444" },
    { key:"processing", label:"Diproses",  count:counts.processing, dot:"#3b82f6" },
  ];

  return (
    <AppLayout>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>

        {/* Header */}
        <div style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)"}} className="px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{color:"var(--accent)"}}>Database</p>
              <h1 className="font-display text-[24px] font-extrabold tracking-tight" style={{color:"var(--text)"}}>Semua Kandidat</h1>
            </div>
            <div className="flex gap-2.5">
              <Link href="/candidates/bulk" className="btn-secondary">
                <FileSpreadsheet size={13}/> Bulk Upload
              </Link>
              <Link href="/candidates/add" className="btn-primary">
                <UserPlus size={13}/> Add Kandidat
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTERS.map(f=>(
              <button key={f.key} onClick={()=>setFilter(f.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background:filter===f.key?"var(--text)":"var(--bg2)",
                  color:filter===f.key?"var(--bg)":"var(--text2)",
                  border:`1px solid ${filter===f.key?"var(--text)":"var(--border)"}`,
                }}>
                {f.dot&&<span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:f.dot}}/>}
                {f.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{background:filter===f.key?"rgba(255,255,255,0.15)":"var(--bg3)",color:filter===f.key?"inherit":"var(--text3)"}}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"var(--text3)"}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau email kandidat..."
              className="input-base pl-9" style={{boxShadow:"var(--card-shadow)"}}/>
          </div>

          {loading ? (
            <div className="card flex items-center justify-center py-24" style={{color:"var(--text3)"}}>
              <Loader2 size={20} className="animate-spin mr-3"/> Memuat data...
            </div>
          ) : filtered.length===0 ? (
            <div className="card text-center py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:"var(--bg3)"}}>
                <Users size={22} style={{color:"var(--text3)"}}/>
              </div>
              <p className="font-semibold mb-1" style={{color:"var(--text)"}}>Tidak ada kandidat</p>
              <p className="text-[12px] mb-5" style={{color:"var(--text3)"}}>Coba ubah filter atau tambah kandidat baru</p>
              <Link href="/candidates/add" className="btn-primary" style={{display:"inline-flex",margin:"0 auto"}}>
                <Plus size={12}/> Tambah Kandidat
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3" style={{borderBottom:"1px solid var(--border)",background:"var(--bg3)"}}>
                <p className="text-[11px] font-semibold" style={{color:"var(--text3)"}}>{filtered.length} kandidat ditemukan</p>
              </div>
              <table className="w-full">
                <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                  {["Kandidat","Kontak","Status","Risiko","Tanggal",""].map(h=>(
                    <th key={h} className={`text-left px-5 py-3 text-[10px] font-bold tracking-wider ${h==="Kontak"?"hidden md:table-cell":h==="Tanggal"?"hidden lg:table-cell":""}`} style={{color:"var(--text3)"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map(row=>(
                    <tr key={row.id} className="group transition-colors" style={{borderBottom:"1px solid var(--border)"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="var(--bg3)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 shadow-sm"
                            style={{background:"linear-gradient(135deg,var(--accent),#00a07a)"}}>
                            {row.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold leading-tight" style={{color:"var(--text)"}}>{row.full_name}</p>
                            <p className="text-[10px] font-mono" style={{color:"var(--text3)"}}>{row.id.slice(0,8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-[12px] font-medium" style={{color:"var(--text2)"}}>{row.email}</p>
                        <p className="text-[11px]" style={{color:"var(--text3)"}}>{row.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        {!row.report?<span className="text-[11px] font-medium px-2.5 py-1 rounded-lg" style={{background:"var(--bg3)",color:"var(--text3)"}}>Menunggu</span>
                        :row.report.status==="completed"?<span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(0,200,150,0.1)",color:"var(--accent)"}}>✓ Selesai</span>
                        :row.report.status==="failed"?<span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>✗ Gagal</span>
                        :<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{background:"rgba(245,158,11,0.1)",color:"#f59e0b"}}><Loader2 size={9} className="animate-spin"/>Proses</span>}
                      </td>
                      <td className="px-5 py-4">{row.report?.overall_risk?<RiskBadge level={row.report.overall_risk}/>:<span style={{color:"var(--border)"}}>—</span>}</td>
                      <td className="px-5 py-4 text-[11px] hidden lg:table-cell" style={{color:"var(--text3)"}}>{new Date(row.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/candidates/${row.id}`} className="p-2 rounded-lg transition-colors" style={{color:"var(--text3)"}}
                            onMouseEnter={e=>(e.currentTarget.style.color="var(--accent)",e.currentTarget.style.background="rgba(0,200,150,0.1)")}
                            onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)",e.currentTarget.style.background="")}>
                            <Eye size={13}/>
                          </Link>
                          <button onClick={()=>del(row.id)} className="p-2 rounded-lg transition-colors" style={{color:"var(--text3)"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#ef4444";(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.1)"}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="var(--text3)";(e.currentTarget as HTMLButtonElement).style.background=""}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}