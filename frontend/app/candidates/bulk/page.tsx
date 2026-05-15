"use client";
import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, X, Zap, Shield, Globe, Camera, MessageCircle, Link2, Newspaper } from "lucide-react";

interface BulkRow { full_name:string; email:string; phone:string; instagram_url:string; twitter_url:string; facebook_url:string; linkedin_url:string; }

export default function BulkPage() {
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<BulkRow[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [consent,setConsent]=useState(false);
  const [drag,setDrag]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);

  async function handleFile(f:File) {
    setFile(f);setError("");setPreview([]);
    try {
      const XLSX=await import("xlsx");
      const buf=await f.arrayBuffer();
      const wb=XLSX.read(buf);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json<BulkRow>(ws);
      if(rows.length===0){setError("File kosong atau format tidak sesuai.");return;}
      setPreview(rows.slice(0,5));
    } catch{setError("Gagal membaca file. Pastikan format sesuai template.");}
  }

  function downloadTemplate() {
    const csv="full_name,email,phone,instagram_url,twitter_url,facebook_url,linkedin_url\nJohn Doe,john@email.com,08123456789,https://instagram.com/johndoe,https://x.com/johndoe,https://facebook.com/johndoe,https://linkedin.com/in/johndoe\nJane Smith,jane@email.com,08987654321,https://instagram.com/janesmith,https://x.com/janesmith,https://facebook.com/janesmith,https://linkedin.com/in/janesmith";
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="template_hr_screening.csv";a.click();
  }

  async function startBulk() {
    if(!file||!consent)return;
    setLoading(true);
    try {
      const XLSX=await import("xlsx");
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json<BulkRow>(ws);
      const BASE=process.env.NEXT_PUBLIC_API_URL??"http://localhost:8000";
      const token=JSON.parse(localStorage.getItem("hr_user")||"{}").token??"";
      for(const row of rows) {
        await fetch(`${BASE}/api/v1/candidates/`,{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
          body:JSON.stringify({...row,consent_given:true}),
        });
      }
      setDone(true);
    } catch{setError("Terjadi kesalahan saat upload.");}
    finally{setLoading(false);}
  }

  const PLATFORMS=[
    {icon:Camera,      label:"Instagram",   color:"#e1306c"},
    {icon:MessageCircle,label:"Twitter/X",  color:"#1da1f2"},
    {icon:Globe,       label:"Facebook",    color:"#1877f2"},
    {icon:Link2,       label:"LinkedIn",    color:"#0077b5"},
    {icon:Globe,       label:"Google",      color:"#34a853"},
    {icon:Newspaper,   label:"News",        color:"#64748b"},
  ];

  return (
    <AppLayout>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>

        {/* Hero banner */}
        <div style={{background:"linear-gradient(135deg,#0a2e22,#0f1a2e,#0a0e1a)",borderBottom:"1px solid var(--border)"}} className="px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{background:"rgba(0,200,150,0.1)",color:"var(--accent)",border:"1px solid rgba(0,200,150,0.2)"}}>
                <Zap size={9}/> Bulk Screening System
              </div>
            </div>
            <h1 className="font-display text-[32px] font-extrabold text-white tracking-tight mb-3">Upload Kandidat Massal</h1>
            <p className="text-slate-400 text-[14px] mb-6 max-w-lg">Upload file CSV atau Excel untuk screening banyak kandidat sekaligus menggunakan AI background checking.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={downloadTemplate} className="btn-primary"><Download size={13}/> Download Template</button>
              <button onClick={()=>inputRef.current?.click()} className="btn-secondary" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white"}}>
                <Upload size={13}/> Upload Sekarang
              </button>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-8 max-w-sm">
              {[{v:"6+",l:"Platform"},{v:"AI",l:"Powered"},{v:"100+",l:"Batch"},{v:"CSV",l:"& XLSX"}].map(s=>(
                <div key={s.l} className="text-center">
                  <p className="font-display text-lg font-extrabold" style={{color:"var(--accent)"}}>{s.v}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {done ? (
            <div className="card p-10 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:"rgba(0,200,150,0.1)"}}>
                <CheckCircle size={28} style={{color:"var(--accent)"}}/>
              </div>
              <h2 className="font-display text-xl font-bold mb-2" style={{color:"var(--text)"}}>Screening Dimulai!</h2>
              <p className="text-sm mb-6" style={{color:"var(--text2)"}}>Semua kandidat sedang diproses oleh AI. Pantau progress di halaman Kandidat.</p>
              <a href="/candidates" className="btn-primary">Lihat Kandidat →</a>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">

                {/* Template preview */}
                <div className="card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-[15px] font-bold" style={{color:"var(--text)"}}>Download Template</h2>
                      <p className="text-[12px] mt-0.5" style={{color:"var(--text3)"}}>Gunakan template berikut untuk upload kandidat.</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(0,200,150,0.1)"}}>
                      <FileSpreadsheet size={16} style={{color:"var(--accent)"}}/>
                    </div>
                  </div>
                  {/* Mini table preview */}
                  <div className="rounded-xl overflow-hidden mb-4 text-[11px]" style={{border:"1px solid var(--border)"}}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr style={{background:"var(--bg3)",borderBottom:"1px solid var(--border)"}}>
                          {["Full Name","Email","Phone","Instagram","Twitter/X","Facebook","LinkedIn"].map(h=>(
                            <th key={h} className="text-left px-3 py-2 font-bold whitespace-nowrap" style={{color:"var(--text3)"}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {[{n:"John Doe",e:"john@email.com",p:"+62 812 0000",i:"instagram.com/john",t:"x.com/john",f:"facebook.com/john",l:"linkedin.com/in/john"},
                            {n:"Jane Smith",e:"jane@email.com",p:"+62 813 0001",i:"instagram.com/jane",t:"x.com/jane",f:"facebook.com/jane",l:"linkedin.com/in/jane"}].map((r,i)=>(
                            <tr key={i} style={{borderBottom:i===0?"1px solid var(--border)":"none"}}>
                              {[r.n,r.e,r.p,r.i,r.t,r.f,r.l].map((v,j)=>(
                                <td key={j} className="px-3 py-2 whitespace-nowrap" style={{color:"var(--text2)"}}>{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button onClick={downloadTemplate} className="btn-primary w-full justify-center">
                    <Download size={13}/> Download CSV Template
                  </button>
                </div>

                {/* Upload */}
                <div className="card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-[15px] font-bold" style={{color:"var(--text)"}}>Upload File</h2>
                      <p className="text-[12px] mt-0.5" style={{color:"var(--text3)"}}>Upload file Excel atau CSV kandidat.</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(59,130,246,0.1)"}}>
                      <Upload size={16} className="text-blue-500"/>
                    </div>
                  </div>

                  <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>

                  {!file ? (
                    <div onClick={()=>inputRef.current?.click()}
                      onDragOver={e=>{e.preventDefault();setDrag(true)}}
                      onDragLeave={()=>setDrag(false)}
                      onDrop={e=>{e.preventDefault();setDrag(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0])}}
                      className="rounded-xl p-10 text-center cursor-pointer transition-all"
                      style={{
                        border:`2px dashed ${drag?"var(--accent)":"var(--border)"}`,
                        background:drag?"rgba(0,200,150,0.04)":"var(--bg3)"
                      }}>
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{background:"rgba(0,200,150,0.1)"}}>
                        <Upload size={22} style={{color:"var(--accent)"}}/>
                      </div>
                      <p className="font-display text-[15px] font-bold mb-1" style={{color:"var(--text)"}}>Drag & Drop File</p>
                      <p className="text-[12px]" style={{color:"var(--text3)"}}>Mendukung .csv, .xlsx, dan .xls</p>
                      <button className="btn-secondary mt-4" style={{margin:"16px auto 0",display:"inline-flex"}}>Pilih File</button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)"}}>
                        <FileSpreadsheet size={18} style={{color:"var(--accent)"}}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{color:"var(--text)"}}>{file.name}</p>
                          <p className="text-[11px]" style={{color:"var(--text3)"}}>{(file.size/1024).toFixed(1)} KB · {preview.length} baris ditampilkan</p>
                        </div>
                        <button onClick={()=>{setFile(null);setPreview([])}} style={{color:"var(--text3)"}} className="hover:text-red-500 transition-colors"><X size={15}/></button>
                      </div>

                      {preview.length>0&&(
                        <div className="rounded-xl overflow-hidden mb-4 text-[11px]" style={{border:"1px solid var(--border)"}}>
                          <p className="px-3 py-2 font-bold" style={{background:"var(--bg3)",color:"var(--text3)",borderBottom:"1px solid var(--border)"}}>Preview (5 baris pertama)</p>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                                {["Nama","Email","HP"].map(h=><th key={h} className="text-left px-3 py-2 font-bold" style={{color:"var(--text3)"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {preview.map((r,i)=>(
                                  <tr key={i} style={{borderBottom:i<preview.length-1?"1px solid var(--border)":"none"}}>
                                    <td className="px-3 py-2 font-medium" style={{color:"var(--text)"}}>{r.full_name}</td>
                                    <td className="px-3 py-2" style={{color:"var(--text2)"}}>{r.email}</td>
                                    <td className="px-3 py-2" style={{color:"var(--text2)"}}>{r.phone}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Consent */}
                      <div className="rounded-xl p-4 mb-4 cursor-pointer transition-all" onClick={()=>setConsent(c=>!c)}
                        style={{background:consent?"rgba(0,200,150,0.07)":"var(--bg3)",border:`1px solid ${consent?"rgba(0,200,150,0.25)":"var(--border)"}`}}>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                            style={{background:consent?"var(--accent)":"transparent",border:`2px solid ${consent?"var(--accent)":"var(--border)"}`}}>
                            {consent&&<span className="text-white text-[10px] font-bold">✓</span>}
                          </div>
                          <p className="text-[12px] leading-relaxed" style={{color:"var(--text2)"}}>
                            <strong style={{color:"var(--text)"}}>Pernyataan Consent</strong> — Semua kandidat dalam file ini telah memberikan persetujuan tertulis sesuai <strong>UU PDP Indonesia</strong>.
                          </p>
                        </div>
                      </div>

                      {error&&<div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-[12px]" style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444"}}><AlertCircle size={13}/>{error}</div>}

                      <button onClick={startBulk} disabled={loading||!consent} className="btn-primary w-full justify-center"
                        style={{opacity:loading||!consent?0.5:1,cursor:loading||!consent?"not-allowed":"pointer"}}>
                        {loading?<><Loader2 size={13} className="animate-spin"/>Memproses...</>:<><Zap size={13}/>Mulai Bulk Screening</>}
                      </button>
                    </div>
                  )}

                  {error&&!file&&<div className="flex items-center gap-2 mt-3 p-3 rounded-xl text-[12px]" style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444"}}><AlertCircle size={13}/>{error}</div>}
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-5">
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={13} style={{color:"var(--accent)"}}/>
                    <h3 className="font-display text-[13px] font-bold" style={{color:"var(--text)"}}>AI Screening</h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-auto" style={{background:"rgba(0,200,150,0.1)",color:"var(--accent)"}}>Platform yang dicek</span>
                  </div>
                  <div className="space-y-2">
                    {PLATFORMS.map(p=>(
                      <div key={p.label} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{border:"1px solid var(--border)"}}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${p.color}18`}}>
                          <p.icon size={13} style={{color:p.color}}/>
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold" style={{color:"var(--text)"}}>{p.label}</p>
                          <p className="text-[10px]" style={{color:"var(--text3)"}}>AI automated analysis</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full" style={{background:"var(--accent)"}}/>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5" style={{background:"linear-gradient(135deg,#0a2e22,#0f1a2e)"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={13} style={{color:"var(--accent)"}}/>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{color:"var(--accent)"}}>AI Insight</p>
                  </div>
                  <h3 className="font-display text-[16px] font-extrabold text-white mb-2">Smart Detection</h3>
                  <p className="text-[12px] text-slate-400 leading-relaxed">AI akan otomatis mendeteksi toxic language, fraud, hate speech, explicit content, dan professional risk dari semua platform publik.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}