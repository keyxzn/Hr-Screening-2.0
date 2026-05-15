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
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setError(""); setLoading(true);
    try { await login(email, password); }
    catch (e: any) { setError(e.message ?? "Login gagal."); }
    finally { setLoading(false); }
  }

  const inputStyle = {
    background: "#0f1422",
    border: "1.5px solid #1e2a3d",
    color: "white",
    borderRadius: 12,
    padding: "12px 14px 12px 40px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "DM Sans, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", alignItems: "stretch" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#071a12 0%,#0a1020 50%,#080b14 100%)" }}>

        {/* Grid bg */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        {/* Glows */}
        <div className="absolute top-1/3 -left-16 w-80 h-80 rounded-full opacity-25 blur-3xl" style={{ background: "#00c896" }} />
        <div className="absolute bottom-1/4 right-0 w-56 h-56 rounded-full opacity-10 blur-3xl" style={{ background: "#3b82f6" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: "linear-gradient(135deg,#00c896,#00a07a)" }}>
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-extrabold text-white text-lg tracking-tight leading-none">
              HR<span style={{ color: "#00c896" }}>Check</span>
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "#4b6a58" }}>Screening AI</p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6"
            style={{ background: "rgba(0,200,150,0.1)", color: "#00c896", border: "1px solid rgba(0,200,150,0.2)" }}>
            <Zap size={9} /> AI-Powered Platform
          </div>
          <h2 className="font-display text-[38px] font-extrabold text-white leading-tight tracking-tight mb-4">
            Screening Kandidat<br /><span style={{ color: "#00c896" }}>Lebih Cerdas</span>
          </h2>
          <p className="text-[14px] leading-relaxed mb-8 max-w-sm" style={{ color: "#64748b" }}>
            Platform HR screening berbasis AI yang menganalisis data publik kandidat dari berbagai platform sosial media secara legal dan profesional.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {[
              { icon: "🛡️", label: "Legal & Sesuai UU PDP Indonesia" },
              { icon: "🤖", label: "AI analisis dengan Ollama + Llama 3" },
              { icon: "📊", label: "Report risiko per kategori otomatis" },
              { icon: "⚡", label: "Bulk screening ratusan kandidat sekaligus" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.15)" }}>
                  <span className="text-sm">{f.icon}</span>
                </div>
                <span className="text-[13px]" style={{ color: "#94a3b8" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[11px]" style={{ color: "#1e2a3d" }}>© 2026 HRCheck · Confidential</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: "#080b14" }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#00c896,#00a07a)" }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-display font-extrabold text-white text-lg">
            HR<span style={{ color: "#00c896" }}>Check</span>
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h1 className="font-display text-[28px] font-extrabold text-white tracking-tight mb-1.5">
              Selamat Datang
            </h1>
            <p className="text-[13px]" style={{ color: "#64748b" }}>
              Masuk ke dashboard HR Screening
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl text-[12px] mb-5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#64748b" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="hr@perusahaan.com"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "#00c896"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,150,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#1e2a3d"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#64748b" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = "#00c896"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,150,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#1e2a3d"; e.target.style.boxShadow = "none"; }}
                />
                <button onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 rounded"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-[14px] text-white transition-all"
            style={{
              background: loading ? "#0f1a2e" : "linear-gradient(135deg,#00c896,#00a07a)",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(0,200,150,0.3)",
              border: "none",
              opacity: loading ? 0.8 : 1,
            }}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" />Masuk...</>
              : <><Shield size={14} />Masuk ke HRCheck</>
            }
          </button>

          <div className="flex items-center gap-3 mt-6 mb-4">
            <div className="flex-1 h-px" style={{ background: "#0f1a2e" }} />
            <span className="text-[10px] font-semibold" style={{ color: "#1e2a3d" }}>Akses Terbatas</span>
            <div className="flex-1 h-px" style={{ background: "#0f1a2e" }} />
          </div>

          <p className="text-center text-[11px] leading-relaxed" style={{ color: "#334155" }}>
            Hanya untuk HR & personel berwenang.<br />
            Hubungi admin untuk mendapatkan akun.
          </p>
        </div>
      </div>
    </div>
  );
}