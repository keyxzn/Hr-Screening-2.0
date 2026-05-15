"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Shield, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function submit() {
    if(!email||!password){setError("Email dan password wajib diisi.");return;}
    setError("");setLoading(true);
    try { await login(email,password); }
    catch(e:any){ setError(e.message??"Login gagal."); }
    finally{ setLoading(false); }
  }

  return (
    <div style={{minHeight:"100vh",background:"#080b14",display:"flex",alignItems:"stretch"}}>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{background:"linear-gradient(135deg,#0a2e22 0%,#081420 50%,#0a0e1a 100%)"}}>
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"linear-gradient(var(--border,#1e2535) 1px,transparent 1px),linear-gradient(90deg,var(--border,#1e2535) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
        {/* Glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{background:"#00c896"}}/>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background:"#3b82f6"}}/>

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl" style={{background:"linear-gradient(135deg,#00c896,#00a07a)"}}>
            <Shield size={18} className="text-white"/>
          </div>
          <div>
            <p className="font-display font-extrabold text-white text-lg tracking-tight leading-none">HR<span style={{color:"#00c896"}}>Check</span></p>
            <p className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{color:"#334155"}}>Screening AI</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6" style={{background:"rgba(0,200,150,0.1)",color:"#00c896",border:"1px solid rgba(0,200,150,0.2)"}}>
            <Zap size={9}/> AI-Powered Platform
          </div>
          <h2 className="font-display text-[36px] font-extrabold text-white leading-tight tracking-tight mb-4">
            Screening Kandidat<br/><span style={{color:"#00c896"}}>Lebih Cerdas</span>
          </h2>
          <p className="text-slate-400 text-[14px] leading-relaxed mb-8 max-w-sm">
            Platform HR screening berbasis AI yang menganalisis data publik kandidat dari berbagai platform sosial media secara legal dan profesional.
          </p>
          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon:"🛡️", label:"Legal & Sesuai UU PDP Indonesia" },
              { icon:"🤖", label:"AI analisis dengan Ollama + Llama 3" },
              { icon:"📊", label:"Report risiko per kategori otomatis" },
              { icon:"⚡", label:"Bulk screening ratusan kandidat sekaligus" },
            ].map(f=>(
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-[13px] text-slate-400">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-[11px]" style={{color:"#1e2535"}}>© 2026 HRCheck · Confidential</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{background:"#080b14"}}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#00c896,#00a07a)"}}>
            <Shield size={16} className="text-white"/>
          </div>
          <span className="font-display font-extrabold text-white text-lg">HR<span style={{color:"#00c896"}}>Check</span></span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="font-display text-[26px] font-extrabold text-white tracking-tight mb-1">Selamat Datang</h1>
            <p className="text-[13px]" style={{color:"#4b5563"}}>Masuk ke dashboard HR Screening</p>
          </div>

          {error&&(
            <div className="flex items-center gap-2 p-3.5 rounded-xl text-[12px] mb-5" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444"}}>
              <AlertCircle size={13} className="flex-shrink-0"/> {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"#374151"}}>Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"#374151"}}/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&submit()}
                  placeholder="hr@perusahaan.com"
                  className="w-full"
                  style={{background:"#0f1422",border:"1.5px solid #1e2535",color:"white",borderRadius:10,padding:"11px 14px 11px 38px",fontSize:13,outline:"none",transition:"border-color 0.15s",fontFamily:"DM Sans,sans-serif"}}
                  onFocus={e=>e.target.style.borderColor="#00c896"}
                  onBlur={e=>e.target.style.borderColor="#1e2535"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{color:"#374151"}}>Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:"#374151"}}/>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&submit()}
                  placeholder="••••••••"
                  className="w-full"
                  style={{background:"#0f1422",border:"1.5px solid #1e2535",color:"white",borderRadius:10,padding:"11px 40px 11px 38px",fontSize:13,outline:"none",transition:"border-color 0.15s",fontFamily:"DM Sans,sans-serif"}}
                  onFocus={e=>e.target.style.borderColor="#00c896"}
                  onBlur={e=>e.target.style.borderColor="#1e2535"}
                />
                <button onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{color:"#374151"}} onMouseEnter={e=>(e.currentTarget.style.color="#9ca3af")} onMouseLeave={e=>(e.currentTarget.style.color="#374151")}>
                  {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-[14px] text-white transition-all"
            style={{background:loading?"#0f1a2e":"linear-gradient(135deg,#00c896,#00a07a)",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 8px 24px rgba(0,200,150,0.3)",border:"none"}}>
            {loading?<><Loader2 size={15} className="animate-spin"/>Masuk...</>:<><Shield size={14}/>Masuk ke HRCheck</>}
          </button>

          <p className="text-center text-[11px] mt-6" style={{color:"#1e2535"}}>
            Akses hanya untuk HR & personel berwenang.<br/>Hubungi admin untuk mendapatkan akun.
          </p>
        </div>
      </div>
    </div>
  );
}