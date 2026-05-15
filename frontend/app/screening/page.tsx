"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, CandidateCreate } from "@/lib/api";
import {
  User, Mail, Phone, Link, Camera, MessageCircle, Globe,
  Shield, Search, CheckCircle2, AlertCircle, Loader2, ExternalLink
} from "lucide-react";

const PLATFORMS = [
  { id: "instagram", icon: Camera,        label: "Instagram",   color: "text-pink-500",  ph: "https://instagram.com/username" },
  { id: "twitter",   icon: MessageCircle, label: "X / Twitter", color: "text-sky-500",   ph: "https://x.com/username" },
  { id: "facebook",  icon: Globe,         label: "Facebook",    color: "text-blue-600",  ph: "https://facebook.com/username" },
  { id: "linkedin",  icon: Link,          label: "LinkedIn",    color: "text-blue-700",  ph: "https://linkedin.com/in/username" },
];

export default function ScreeningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    instagram_url: "", twitter_url: "", facebook_url: "", linkedin_url: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.full_name || !form.email || !form.phone) {
      setError("Nama, email, dan nomor HP wajib diisi."); return;
    }
    if (!consent) { setError("Centang consent terlebih dahulu."); return; }
    setError(""); setLoading(true);
    try {
      const candidate = await api.createCandidate({ ...form, consent_given: true });
      router.push(`/candidates/${candidate.id}`);
    } catch (e: any) {
      setError(e.message ?? "Terjadi kesalahan, coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-2">Screening Baru</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cek Background Kandidat</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Isi data kandidat di bawah. Sistem akan menganalisis profil publik dari berbagai platform sosial media secara legal & profesional.
          </p>
        </div>

        {/* Data Kandidat */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <User size={15} className="text-slate-400" /> Data Kandidat
          </h2>
          <div className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap <span className="text-red-400">*</span></label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.full_name} onChange={set("full_name")} placeholder="Budi Santoso"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-slate-50 transition" />
              </div>
            </div>
            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.email} onChange={set("email")} type="email" placeholder="budi@email.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-slate-50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nomor HP <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.phone} onChange={set("phone")} placeholder="+62 812 3456 7890"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-slate-50 transition" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sosial Media */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <ExternalLink size={15} className="text-slate-400" /> URL Profil Sosial Media
          </h2>
          <p className="text-xs text-slate-400 mb-5">Opsional — jika URL diisi, data publik akan diambil langsung dari profil kandidat.</p>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map(({ id, icon: Icon, label, color, ph }) => (
              <div key={id}>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Icon size={12} className={color} /> {label}
                </label>
                <input value={(form as any)[`${id}_url`]} onChange={set(`${id}_url`)} placeholder={ph}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 bg-slate-50 transition" />
              </div>
            ))}
          </div>

          {/* Platform yang akan dicek */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3">Platform yang akan dicek otomatis:</p>
            <div className="flex flex-wrap gap-2">
              {["📸 Instagram", "🐦 X / Twitter", "👤 Facebook", "💼 LinkedIn", "🔍 Google Search", "📰 News & Forum"].map(p => (
                <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{p}</span>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Hanya data <strong>publik</strong> yang diakses. Tidak ada login, tidak ada akses akun privat.</p>
          </div>
        </div>

        {/* Consent */}
        <div className={`rounded-2xl p-5 mb-5 border transition-all ${consent ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
          <label className="flex items-start gap-3 cursor-pointer" onClick={() => setConsent(c => !c)}>
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${consent ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
              {consent && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Pernyataan Consent</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Saya menyatakan bahwa kandidat telah memberikan persetujuan tertulis untuk dilakukan pengecekan data publik ini sesuai dengan <strong>UU Perlindungan Data Pribadi (UU PDP)</strong> Indonesia dan kebijakan perusahaan yang berlaku.
              </p>
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={loading || !consent}
          className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center justify-center gap-2 ${
            loading || !consent
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] active:scale-100"
          }`}>
          {loading ? <><Loader2 size={15} className="animate-spin" /> Memulai screening...</> : <><Search size={15} /> Mulai Screening Kandidat</>}
        </button>
      </div>
    </div>
  );
}
