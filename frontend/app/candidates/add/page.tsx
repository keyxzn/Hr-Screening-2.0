"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { User, Mail, Phone, Camera, MessageCircle, Globe, Link2, Search, AlertCircle, Loader2, Shield, Zap } from "lucide-react";

const PLATFORMS = [
  { id:"instagram", icon:Camera,         label:"Instagram",   color:"#e1306c", ph:"https://instagram.com/username" },
  { id:"twitter",   icon:MessageCircle,  label:"X / Twitter", color:"#1da1f2", ph:"https://x.com/username" },
  { id:"facebook",  icon:Globe,          label:"Facebook",    color:"#1877f2", ph:"https://facebook.com/username" },
  { id:"linkedin",  icon:Link2,          label:"LinkedIn",    color:"#0077b5", ph:"https://linkedin.com/in/username" },
];

export default function AddCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [consent, setConsent] = useState(false);
  const [form, setForm]       = useState({ full_name:"", email:"", phone:"", instagram_url:"", twitter_url:"", facebook_url:"", linkedin_url:"" });
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setForm(f=>({...f,[k]:e.target.value}));

  async function submit() {
    if(!form.full_name||!form.email||!form.phone){setError("Nama, email, dan nomor HP wajib diisi.");return;}
    if(!form.instagram_url||!form.twitter_url||!form.facebook_url||!form.linkedin_url){
      setError("Semua field sosial media wajib diisi. Tulis 'tidak ada' jika tidak punya.");return;
    }
    if(!consent){setError("Centang pernyataan consent terlebih dahulu.");return;}
    setError("");setLoading(true);
    try {
      const candidate=await api.createCandidate({...form,consent_given:true});
      router.push(`/candidates/${candidate.id}`);
    } catch(e:any){setError(e.message??"Terjadi kesalahan.");setLoading(false);}
  }

  return (
    <AppLayout>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>

        {/* Mini hero */}
        <div style={{background:"linear-gradient(135deg,#0a2e22 0%,#0a0e1a 100%)",borderBottom:"1px solid var(--border)"}} className="px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{color:"var(--accent)"}}>Kandidat → Add Perorangan</p>
            <h1 className="font-display text-[26px] font-extrabold text-white tracking-tight">Tambah Kandidat Baru</h1>
            <p className="text-slate-400 text-[13px] mt-1">Isi data kandidat untuk memulai AI background screening.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* Data Kandidat */}
          <div className="card p-6">
            <div className="flex items-center gap-2.5 mb-5 pb-4" style={{borderBottom:"1px solid var(--border)"}}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"rgba(0,200,150,0.1)"}}>
                <User size={13} style={{color:"var(--accent)"}}/>
              </div>
              <h2 className="font-display text-[14px] font-bold" style={{color:"var(--text)"}}>Data Kandidat</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"var(--text3)"}}>Nama Lengkap <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"var(--text3)"}}/>
                  <input value={form.full_name} onChange={set("full_name")} placeholder="Nama lengkap kandidat"
                    className="input-base pl-9"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"var(--text3)"}}>Email <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"var(--text3)"}}/>
                    <input value={form.email} onChange={set("email")} type="email" placeholder="email@domain.com" className="input-base pl-9"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"var(--text3)"}}>Nomor HP <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"var(--text3)"}}/>
                    <input value={form.phone} onChange={set("phone")} placeholder="+62 812 xxxx xxxx" className="input-base pl-9"/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sosial Media */}
          <div className="card p-6">
            <div className="flex items-center gap-2.5 mb-2 pb-4" style={{borderBottom:"1px solid var(--border)"}}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"rgba(59,130,246,0.1)"}}>
                <Globe size={13} className="text-blue-500"/>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-[14px] font-bold" style={{color:"var(--text)"}}>URL Profil Sosial Media</h2>
                <p className="text-[11px] mt-0.5" style={{color:"var(--text3)"}}>Wajib diisi — tulis URL atau <strong>"tidak ada"</strong> jika tidak punya akun.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {PLATFORMS.map(({id,icon:Icon,label,color,ph})=>(
                <div key={id}>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Icon size={11} style={{color}}/>
                    <span style={{color:"var(--text3)"}}>{label}</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input value={(form as any)[`${id}_url`]} onChange={set(`${id}_url`)} placeholder={ph}
                    className="input-base text-[12px]"/>
                </div>
              ))}
            </div>

            {/* Platform info */}
            <div className="mt-5 pt-4" style={{borderTop:"1px solid var(--border)"}}>
              <p className="text-[11px] font-semibold mb-2.5" style={{color:"var(--text3)"}}>Platform yang dicek otomatis:</p>
              <div className="flex flex-wrap gap-2">
                {["📸 Instagram","🐦 X/Twitter","👤 Facebook","💼 LinkedIn","🔍 Google Search","📰 Berita & Forum"].map(p=>(
                  <span key={p} className="text-[10px] font-medium px-2.5 py-1 rounded-lg" style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text2)"}}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="rounded-2xl p-4 cursor-pointer transition-all" onClick={()=>setConsent(c=>!c)}
            style={{background:consent?"rgba(0,200,150,0.07)":"var(--bg3)",border:`1.5px solid ${consent?"rgba(0,200,150,0.3)":"var(--border)"}`}}>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{background:consent?"var(--accent)":"transparent",border:`2px solid ${consent?"var(--accent)":"var(--border)"}`}}>
                {consent&&<span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{color:"var(--text)"}}>Pernyataan Consent</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{color:"var(--text2)"}}>
                  Kandidat telah memberikan persetujuan tertulis untuk pengecekan data publik sesuai <strong>UU Perlindungan Data Pribadi (UU PDP)</strong> Indonesia.
                </p>
              </div>
            </div>
          </div>

          {error&&(
            <div className="flex items-center gap-2 p-3.5 rounded-xl text-[12px]" style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444"}}>
              <AlertCircle size={13}/> {error}
            </div>
          )}

          <button onClick={submit} disabled={loading||!consent} className="btn-primary w-full justify-center py-3"
            style={{opacity:loading||!consent?0.5:1,cursor:loading||!consent?"not-allowed":"pointer",fontSize:14}}>
            {loading?<><Loader2 size={14} className="animate-spin"/>Memulai screening...</>:<><Zap size={14}/>Mulai Screening Kandidat</>}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}