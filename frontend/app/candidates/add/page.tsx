"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";

import {
  User,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Zap,
  Globe,
  Camera,
  MessageCircle,
  Link2,
} from "lucide-react";

const SOCIALS = [
  {
    id: "instagram",
    icon: Camera,
    label: "Instagram",
    color: "#e1306c",
    bg: "rgba(225,48,108,0.08)",
    ph: "https://instagram.com/username",
  },
  {
    id: "twitter",
    icon: MessageCircle,
    label: "X / Twitter",
    color: "#1d9bf0",
    bg: "rgba(29,155,240,0.08)",
    ph: "https://x.com/username",
  },
  {
    id: "facebook",
    icon: Globe,
    label: "Facebook",
    color: "#1877f2",
    bg: "rgba(24,119,242,0.08)",
    ph: "https://facebook.com/username",
  },
  {
    id: "linkedin",
    icon: Link2,
    label: "LinkedIn",
    color: "#0077b5",
    bg: "rgba(0,119,181,0.08)",
    ph: "https://linkedin.com/in/username",
  },
];

const PLATFORM_BADGES = [
  { label: "Instagram", color: "#e1306c" },
  { label: "X/Twitter", color: "#1d9bf0" },
  { label: "Facebook", color: "#1877f2" },
  { label: "LinkedIn", color: "#0077b5" },
  { label: "Google", color: "#34a853" },
  { label: "Berita", color: "#64748b" },
];

export default function AddCandidatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    instagram_url: "",
    twitter_url: "",
    facebook_url: "",
    linkedin_url: "",
  });

  const set =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [k]: e.target.value,
      }));

  async function submit() {
    if (!form.full_name || !form.email || !form.phone) {
      setError("Nama, email, dan nomor HP wajib diisi.");
      return;
    }

    if (
      !form.instagram_url &&
      !form.twitter_url &&
      !form.facebook_url &&
      !form.linkedin_url
    ) {
      setError("Minimal satu URL sosial media harus diisi.");
      return;
    }

    if (!consent) {
      setError("Centang pernyataan consent terlebih dahulu.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const candidate = await api.createCandidate({
        ...form,
        consent_given: true,
      });

      router.push(`/candidates/${candidate.id}`);
    } catch (e: any) {
      setError(e.message ?? "Terjadi kesalahan.");
      setLoading(false);
    }
  }

  const LabelField = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text3)",
      }}
    >
      {children}
    </span>
  );

  return (
    <AppLayout>
      <div style={{ minHeight: "100vh" }}>
        {/* HERO */}
        <div
          style={{
            background:
              "linear-gradient(180deg,#0f172a 0%, #1e293b 100%)",
            borderBottom:
              "1px solid rgba(255,255,255,0.06)",
            padding: "36px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "rgba(0,200,150,0.05)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: -40,
              right: 160,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.04)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--accent)",
                  fontWeight: 600,
                }}
              >
                Kandidat
              </span>

              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 12,
                }}
              >
                /
              </span>

              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 600,
                }}
              >
                Add Perorangan
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 32,
                color: "#fff",
                letterSpacing: "-0.03em",
                marginBottom: 10,
              }}
            >
              Tambah Kandidat Baru
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              Isi data kandidat untuk memulai AI background
              screening.
            </p>

            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {PLATFORM_BADGES.map((p) => (
                <span
                  key={p.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "5px 11px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border:
                      "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: p.color,
                    }}
                  />

                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FORM */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Data Kandidat */}
          <div className="card fade-up" style={{ padding:"28px 28px" }}>
            <div
              style={{
                display:"flex",
                alignItems:"center",
                gap:12,
                marginBottom:24,
                paddingBottom:18,
                borderBottom:"1px solid var(--border)"
              }}
            >
              <div
                style={{
                  width:34,
                  height:34,
                  borderRadius:10,
                  background:"var(--accent-d)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}
              >
                <User size={14} style={{ color:"var(--accent)" }} />
              </div>

              <h2
                style={{
                  fontFamily:"'Syne',sans-serif",
                  fontWeight:700,
                  fontSize:16,
                  color:"var(--text)"
                }}
              >
                Data Kandidat
              </h2>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div>
                <label style={{ display:"block", marginBottom:8 }}>
                  <LabelField>
                    Nama Lengkap <span style={{ color:"var(--danger)" }}>*</span>
                  </LabelField>
                </label>

                <div style={{ position:"relative" }}>
                  <User
                    size={13}
                    style={{
                      position:"absolute",
                      left:13,
                      top:"50%",
                      transform:"translateY(-50%)",
                      color:"var(--text3)"
                    }}
                  />

                  <input
                    value={form.full_name}
                    onChange={set("full_name")}
                    placeholder="Nama lengkap kandidat"
                    className="input-base"
                    style={{ paddingLeft:40 }}
                  />
                </div>
              </div>

              <div
                style={{
                  display:"grid",
                  gridTemplateColumns:"1fr 1fr",
                  gap:16
                }}
              >
                <div>
                  <label style={{ display:"block", marginBottom:8 }}>
                    <LabelField>
                      Email <span style={{ color:"var(--danger)" }}>*</span>
                    </LabelField>
                  </label>

                  <div style={{ position:"relative" }}>
                    <Mail
                      size={13}
                      style={{
                        position:"absolute",
                        left:13,
                        top:"50%",
                        transform:"translateY(-50%)",
                        color:"var(--text3)"
                      }}
                    />

                    <input
                      value={form.email}
                      onChange={set("email")}
                      type="email"
                      placeholder="email@domain.com"
                      className="input-base"
                      style={{ paddingLeft:40 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display:"block", marginBottom:8 }}>
                    <LabelField>
                      Nomor HP <span style={{ color:"var(--danger)" }}>*</span>
                    </LabelField>
                  </label>

                  <div style={{ position:"relative" }}>
                    <Phone
                      size={13}
                      style={{
                        position:"absolute",
                        left:13,
                        top:"50%",
                        transform:"translateY(-50%)",
                        color:"var(--text3)"
                      }}
                    />

                    <input
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+62 812 xxxx xxxx"
                      className="input-base"
                      style={{ paddingLeft:40 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sosial Media */}
          <div className="card fade-up d2" style={{ padding:"28px 28px" }}>
            <div
              style={{
                display:"flex",
                alignItems:"flex-start",
                gap:12,
                marginBottom:24,
                paddingBottom:18,
                borderBottom:"1px solid var(--border)"
              }}
            >
              <div
                style={{
                  width:34,
                  height:34,
                  borderRadius:10,
                  background:"rgba(59,130,246,0.12)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  flexShrink:0
                }}
              >
                <Globe size={14} style={{ color:"#60a5fa" }} />
              </div>

              <div>
                <h2
                  style={{
                    fontFamily:"'Syne',sans-serif",
                    fontWeight:700,
                    fontSize:16,
                    color:"var(--text)"
                  }}
                >
                  URL Profil Sosial Media
                </h2>

                <p
                  style={{
                    fontSize:12.5,
                    color:"var(--text3)",
                    marginTop:4,
                    lineHeight:1.5
                  }}
                >
                  Wajib diisi minimal 1 platform — tulis URL atau{" "}
                  <code
                    style={{
                      padding:"1px 6px",
                      borderRadius:5,
                      background:"var(--bg3)",
                      border:"1px solid var(--border)",
                      color:"var(--text2)",
                      fontSize:11,
                      fontFamily:"'JetBrains Mono',monospace"
                    }}
                  >
                    tidak ada
                  </code>{" "}
                  jika tidak punya akun.
                </p>
              </div>
            </div>

            <div
              style={{
                display:"grid",
                gridTemplateColumns:"1fr 1fr",
                gap:16
              }}
            >
              {SOCIALS.map(({ id, icon:Icon, label, color, bg, ph }) => (
                <div key={id}>
                  <label
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:6,
                      marginBottom:8
                    }}
                  >
                    <span
                      style={{
                        width:20,
                        height:20,
                        borderRadius:6,
                        background:bg,
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center",
                        flexShrink:0
                      }}
                    >
                      <Icon size={10} style={{ color }} />
                    </span>

                    <LabelField>{label}</LabelField>
                  </label>

                  <input
                    value={(form as any)[`${id}_url`]}
                    onChange={set(`${id}_url`)}
                    placeholder={ph}
                    className="input-base"
                    style={{ fontSize:12.5 }}
                  />
                </div>
              ))}
            </div>
          </div>

                    {/* Consent + Submit */}
          <div className="fade-up d3">
            <div
              onClick={() => setConsent((c) => !c)}
              style={{
                padding: "18px 20px",
                borderRadius: 16,
                cursor: "pointer",
                marginBottom: 16,
                transition: "all 0.15s",
                background: consent
                  ? "rgba(0,200,150,0.08)"
                  : "var(--bg3)",
                border: `1.5px solid ${
                  consent
                    ? "rgba(0,200,150,0.25)"
                    : "var(--border)"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    flexShrink: 0,
                    marginTop: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                    background: consent
                      ? "var(--accent)"
                      : "transparent",
                    border: `2px solid ${
                      consent
                        ? "var(--accent)"
                        : "var(--border2)"
                    }`,
                  }}
                >
                  {consent && (
                    <span
                      style={{
                        color: "#061814",
                        fontSize: 11,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text2)",
                    lineHeight: 1.55,
                  }}
                >
                  <strong
                    style={{
                      color: "var(--text)",
                      fontFamily: "'Syne',sans-serif",
                    }}
                  >
                    Pernyataan Consent
                  </strong>{" "}
                  — Kandidat telah memberikan persetujuan
                  tertulis untuk pengecekan data publik sesuai{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    UU Perlindungan Data Pribadi (UU PDP)
                  </strong>{" "}
                  Indonesia.
                </p>
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 12,
                  marginBottom: 16,
                  background: "var(--danger-d)",
                  border:
                    "1px solid rgba(239,68,68,0.2)",
                  color: "var(--danger)",
                  fontSize: 13,
                }}
              >
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !consent}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                fontSize: 14.5,
                padding: "14px 24px",
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Memproses...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Mulai Screening Kandidat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}