"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import { api, Candidate, ScreeningReport } from "@/lib/api";
import { Plus, Upload, Trash2, Eye, Loader2, Users, Search, UserPlus, FileSpreadsheet } from "lucide-react";

type Row = Candidate & { report?: ScreeningReport };

export default function CandidatesPage() {
  const [rows, setRows]     = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    try {
      const c = await api.listCandidates();
      const w = await Promise.all(c.map(async x=>{ try { return {...x,report:await api.getReport(x.id)} } catch { return x } }));
      setRows(w);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  async function del(id:string) {
    if (!confirm("Hapus kandidat ini?")) return;
    await api.deleteCandidate(id);
    setRows(r=>r.filter(x=>x.id!==id));
  }

  const filtered = rows.filter(r=>{
    const ms = r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || r.report?.overall_risk===filter ||
      (filter==="processing" && (r.report?.status==="processing"||r.report?.status==="pending"));
    return ms && mf;
  });

  const cnts = {
    all:        rows.length,
    low:        rows.filter(r=>r.report?.overall_risk==="low").length,
    medium:     rows.filter(r=>r.report?.overall_risk==="medium").length,
    high:       rows.filter(r=>r.report?.overall_risk==="high"||r.report?.overall_risk==="critical").length,
    processing: rows.filter(r=>r.report?.status==="processing"||r.report?.status==="pending").length,
  };

  const FILTERS = [
    { key:"all",        label:"Semua",    count:cnts.all,        dot:"" },
    { key:"low",        label:"Low Risk", count:cnts.low,        dot:"var(--success)" },
    { key:"medium",     label:"Sedang",   count:cnts.medium,     dot:"var(--warning)" },
    { key:"high",       label:"Tinggi",   count:cnts.high,       dot:"var(--danger)" },
    { key:"processing", label:"Diproses", count:cnts.processing, dot:"var(--blue)" },
  ];

  const fmt = (d:string) => new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});

  return (
    <AppLayout>
      <div style={{ minHeight:"100vh" }}>
        {/* Header */}
        <div style={{ background:"var(--bg2)", borderBottom:"1px solid var(--border)", padding:"24px 32px" }}>
          <div style={{ maxWidth:1040, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>Database</p>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color:"var(--text)", letterSpacing:"-0.03em" }}>Semua Kandidat</h1>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Link href="/candidates/bulk" className="btn btn-ghost"><FileSpreadsheet size={13} /> Bulk Upload</Link>
              <Link href="/candidates/add" className="btn btn-primary"><UserPlus size={13} /> Add Kandidat</Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1040, margin:"0 auto", padding:"24px 32px" }}>
          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {FILTERS.map(f=>(
              <button key={f.key} onClick={()=>setFilter(f.key)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                borderRadius:999, fontSize:13, fontWeight:600, cursor:"pointer",
                transition:"all 0.15s", fontFamily:"'DM Sans',sans-serif",
                background: filter===f.key ? "var(--text)" : "var(--bg2)",
                color:       filter===f.key ? "var(--bg)" : "var(--text2)",
                border: `1.5px solid ${filter===f.key ? "var(--text)" : "var(--border)"}`,
              }}>
                {f.dot && <span style={{ width:6, height:6, borderRadius:"50%", background:f.dot }} />}
                {f.label}
                <span style={{
                  fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:999,
                  background: filter===f.key ? "rgba(255,255,255,0.18)" : "var(--bg3)",
                  color: filter===f.key ? "inherit" : "var(--text3)",
                }}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:20 }}>
            <Search size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cari nama atau email kandidat..."
              className="input-base" style={{ paddingLeft:42 }} />
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:64 }} />)}
            </div>
          ) : filtered.length===0 ? (
            <div className="card" style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ width:56, height:56, borderRadius:16, background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Users size={24} style={{ color:"var(--text4)" }} />
              </div>
              <p style={{ fontWeight:700, color:"var(--text)", fontSize:15, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>Tidak ada kandidat</p>
              <p style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>Coba ubah filter atau tambah kandidat baru</p>
              <Link href="/candidates/add" className="btn btn-primary" style={{ display:"inline-flex" }}><Plus size={12} /> Tambah Kandidat</Link>
            </div>
          ) : (
            <div className="card" style={{ overflow:"hidden" }}>
              <div style={{ padding:"12px 22px", borderBottom:"1px solid var(--border)", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <p style={{ fontSize:12, fontWeight:600, color:"var(--text3)" }}>{filtered.length} kandidat ditemukan</p>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"var(--bg3)", borderBottom:"1px solid var(--border)" }}>
                    {["Kandidat","Kontak","Status","Risiko","Tanggal",""].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"11px 22px", fontSize:10.5, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row=>(
                    <tr key={row.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.12s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="var(--bg3)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="")}>
                      <td style={{ padding:"15px 22px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,var(--accent),#009e76)", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#061814" }}>
                            {row.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{row.full_name}</p>
                            <p style={{ fontSize:10.5, color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace" }}>{row.id.slice(0,8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"15px 22px" }}>
                        <p style={{ fontSize:13, fontWeight:500, color:"var(--text2)" }}>{row.email}</p>
                        <p style={{ fontSize:12, color:"var(--text3)" }}>{row.phone}</p>
                      </td>
                      <td style={{ padding:"15px 22px" }}>
                        {!row.report
                          ? <span style={{ fontSize:11.5, fontWeight:600, padding:"4px 11px", borderRadius:999, background:"var(--bg3)", color:"var(--text3)" }}>Menunggu</span>
                          : row.report.status==="completed"
                            ? <span style={{ fontSize:11.5, fontWeight:700, padding:"4px 11px", borderRadius:999, background:"var(--accent-d)", color:"var(--accent)" }}>✓ Selesai</span>
                            : row.report.status==="failed"
                              ? <span style={{ fontSize:11.5, fontWeight:700, padding:"4px 11px", borderRadius:999, background:"var(--danger-d)", color:"var(--danger)" }}>✗ Gagal</span>
                              : <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11.5, fontWeight:700, padding:"4px 11px", borderRadius:999, background:"var(--warn-d)", color:"var(--warning)" }}>
                                  <Loader2 size={9} className="animate-spin" />Proses
                                </span>
                        }
                      </td>
                      <td style={{ padding:"15px 22px" }}>
                        {row.report?.overall_risk ? <RiskBadge level={row.report.overall_risk} /> : <span style={{ color:"var(--border2)" }}>—</span>}
                      </td>
                      <td style={{ padding:"15px 22px", fontSize:12, color:"var(--text3)" }}>{fmt(row.created_at)}</td>
                      <td style={{ padding:"15px 22px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <Link href={`/candidates/${row.id}`} style={{ width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)", textDecoration:"none", transition:"all 0.15s" }}
                            onMouseEnter={e=>{ e.currentTarget.style.color="var(--accent)"; e.currentTarget.style.background="var(--accent-d)"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.color="var(--text3)"; e.currentTarget.style.background="transparent"; }}>
                            <Eye size={13} />
                          </Link>
                          <button onClick={()=>del(row.id)} style={{ width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)", background:"transparent", border:"none", cursor:"pointer", transition:"all 0.15s" }}
                            onMouseEnter={e=>{ e.currentTarget.style.color="var(--danger)"; e.currentTarget.style.background="var(--danger-d)"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.color="var(--text3)"; e.currentTarget.style.background="transparent"; }}>
                            <Trash2 size={13} />
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
