"use client";

import React, { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useParams } from "next/navigation";
import Link from "next/link";
import RiskBadge from "@/components/RiskBadge";
import { api, assessReport, Candidate, ScreeningReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft, Loader2, RefreshCw, Camera, MessageCircle,
  Globe, Link2, Newspaper, AlertTriangle, CheckCircle,
  ShieldAlert, Mail, Phone, Clock, ExternalLink, Download,
  ThumbsUp, ThumbsDown, User, Calendar,
} from "lucide-react";

const RISK_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  explicit_content:  { label: "Explicit Content",   icon: "🔞", desc: "Pornografi / konten vulgar" },
  toxic_language:    { label: "Toxic Language",      icon: "🤬", desc: "Kata kasar, bullying, harassment" },
  hate_speech:       { label: "Hate Speech",         icon: "🚫", desc: "Serangan ras, agama, gender" },
  violence:          { label: "Violence",            icon: "💢", desc: "Ancaman kekerasan" },
  extremism:         { label: "Extremism",           icon: "☢️", desc: "Terorisme / kekerasan politik" },
  professional_risk: { label: "Professional Risk",   icon: "💼", desc: "Fraud, scam, fake profile" },
};

/** Normalize URL sosmed → link https yang valid */
function normalizeSocialUrl(url: string | undefined, platform: string): string | undefined {
  if (!url || url.trim() === "" || url === "tidak ada") return undefined;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const handle = u.replace(/^@/, "");
  switch (platform) {
    case "instagram": return `https://www.instagram.com/${handle}/`;
    case "twitter":   return `https://x.com/${handle}`;
    case "facebook":  return `https://www.facebook.com/${handle}`;
    case "linkedin":  return `https://www.linkedin.com/in/${handle}`;
    default:          return `https://${u}`;
  }
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram:      Camera,
  twitter:        MessageCircle,
  facebook:       Globe,
  linkedin:       Link2,
  google:         Globe,
  google_results: Globe,
  news:           Newspaper,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram:      "#e1306c",
  twitter:        "#1d9bf0",
  facebook:       "#1877f2",
  linkedin:       "#0077b5",
  google:         "#4285f4",
  google_results: "#4285f4",
  news:           "#6b7280",
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score < 25 ? "#22c55e" : score < 50 ? "#f59e0b" : score < 75 ? "#f97316" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.7s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 28, textAlign: "right" }}>{score}</span>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [report, setReport] = useState<ScreeningReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "details" | "flags">("overview");
  const [elapsed, setElapsed] = useState(0);
  const [assessing, setAssessing] = useState(false);

  const handleAssess = async (status: "appropriate" | "inappropriate") => {
    if (!report) return;
    setAssessing(true);
    try {
      const updated = await assessReport(report.id, { assessment_status: status });
      setReport(updated);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      alert("Gagal menyimpan keputusan HR: " + msg);
      console.error("assess error:", e);
    } finally { setAssessing(false); }
  };

  const handleDownload = async () => {
    if (!candidate || !report) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const scores  = report.risk_scores  ?? {};
    const flagged = report.flagged_content ?? [];
    const W = 210, H = 297, m = 15;
    let y = 0;

    // ── Palette ──────────────────────────────────────────────────────────────
    const riskLabel: Record<string,string> = { low:"Rendah", medium:"Sedang", high:"Tinggi", critical:"Kritis" };
    const riskRGB:   Record<string,[number,number,number]> = {
      low:[5,150,105], medium:[217,119,6], high:[220,38,38], critical:[153,27,27]
    };
    const risk = report.overall_risk ?? "low";
    const AC: [number,number,number] = riskRGB[risk];

    const DARK:  [number,number,number] = [15,23,42];
    const MID:   [number,number,number] = [71,85,105];
    const LIGHT: [number,number,number] = [148,163,184];
    const BG:    [number,number,number] = [248,250,252];
    const WHITE: [number,number,number] = [255,255,255];
    const BDR:   [number,number,number] = [220,228,240];

    // ── Helpers ───────────────────────────────────────────────────────────────
    // Strip non-latin chars & escape % so jsPDF helvetica renders cleanly
    const safe = (s:string) =>
      (s??"").replace(/%/g,"%%").replace(/[^\x00-\x7E\u00C0-\u024F]/g,"").trim();

    const newPage = () => { doc.addPage(); y = 20; };
    const guard   = (need:number) => { if (y + need > 272) newPage(); };

    // jsPDF text baseline is at the bottom of the cap-height.
    // For Helvetica: visual centre ≈ circleY + fontSize_pt * 0.176  (empirically tuned)
    const circleText = (txt:string, cx:number, cy2:number, r:number, fgArr:[number,number,number], fs=8) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(fs); doc.setTextColor(...fgArr);
      // offset = radius * 0.38 gives good vertical centring for typical single-char / 2-char labels
      doc.text(txt, cx, cy2 + r*0.38, {align:"center"});
    };

    // Filled rounded pill
    const pill = (txt:string, px:number, py2:number, bgC:[number,number,number], fgC:[number,number,number], pw=24) => {
      doc.setFillColor(...bgC);
      doc.roundedRect(px, py2, pw, 6.5, 1.5, 1.5, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(...fgC);
      doc.text(txt, px + pw/2, py2 + 4.4, {align:"center"});
    };

    // Section heading: coloured left bar + bold label + faint rule
    const heading = (txt:string) => {
      guard(16);
      doc.setFillColor(...AC);
      doc.roundedRect(m, y, 3.5, 10, 1, 1, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(9.5); doc.setTextColor(...DARK);
      doc.text(txt, m+7, y+7.2);
      doc.setDrawColor(...BDR); doc.setLineWidth(0.25);
      const lx = m + 7 + doc.getTextWidth(txt) + 4;
      doc.line(lx, y+4, W-m, y+4);
      y += 15;
    };

    // ════════════════════════════════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════════════════════════════════
    doc.setFillColor(15,23,42);
    doc.rect(0, 0, W, 42, "F");
    doc.setFillColor(...AC);
    doc.rect(0, 42, W, 2.5, "F");

    // Logo square
    doc.setFillColor(...AC);
    doc.roundedRect(m, 9, 24, 24, 3, 3, "F");
    circleText("HR", m+12, 9+12, 12, WHITE, 12);

    // Brand
    doc.setFont("helvetica","bold"); doc.setFontSize(19); doc.setTextColor(...WHITE);
    doc.text("HRCheck", m+32, 23);
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...LIGHT);
    doc.text("AI Recruitment Screening Platform", m+32, 30);

    // Meta right
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(200,210,225);
    doc.text("BACKGROUND CHECK REPORT", W-m, 18, {align:"right"});
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...LIGHT);
    doc.text(new Date().toLocaleString("id-ID"), W-m, 25, {align:"right"});
    doc.text(`Report ID: ${safe(report.id.slice(0,20))}...`, W-m, 32, {align:"right"});

    y = 52;

    // ════════════════════════════════════════════════════════════════════════
    // CANDIDATE INFO CARD
    // ════════════════════════════════════════════════════════════════════════
    const cH = 36;
    doc.setFillColor(...BG);
    doc.roundedRect(m, y, W-m*2, cH, 3, 3, "F");
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.roundedRect(m, y, W-m*2, cH, 3, 3, "S");
    // Accent left bar
    doc.setFillColor(...AC);
    doc.roundedRect(m, y, 3, cH, 1.5, 1.5, "F");

    // Avatar circle — cx, cy, r
    const avCX = m+18, avCY = y+cH/2, avR = 12;
    doc.setFillColor(...AC);
    doc.circle(avCX, avCY, avR, "F");
    circleText(candidate.full_name.charAt(0).toUpperCase(), avCX, avCY, avR, WHITE, 14);

    // Candidate text
    const tx = m+34;
    doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...DARK);
    doc.text(safe(candidate.full_name), tx, y+12);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MID);
    doc.text(`Email : ${safe(candidate.email)}`, tx, y+20);
    doc.text(`Telp  : ${safe(candidate.phone??"-")}`, tx, y+27);
    doc.setFontSize(6.5); doc.setTextColor(...LIGHT);
    doc.text(`ID: ${safe(candidate.id)}`, tx, y+33);

    // Risk badge
    const bdgW = 38, bdgH = 22, bdgX = W-m-bdgW-2, bdgY = y+(cH-bdgH)/2;
    doc.setFillColor(...AC);
    doc.roundedRect(bdgX, bdgY, bdgW, bdgH, 3, 3, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(...WHITE);
    doc.text("RISK LEVEL", bdgX+bdgW/2, bdgY+7, {align:"center"});
    doc.setFontSize(11);
    doc.text((riskLabel[risk]??"").toUpperCase(), bdgX+bdgW/2, bdgY+17, {align:"center"});

    y += cH + 10;

    // ════════════════════════════════════════════════════════════════════════
    // RISK SCORES — full-width single column, clean grid
    // ════════════════════════════════════════════════════════════════════════
    heading("SKOR RISIKO PER KATEGORI");

    const cats: {label:string; key:string; clr:[number,number,number]}[] = [
      {label:"Explicit Content",  key:"explicit_content",  clr:[124,58,237]},
      {label:"Toxic Language",    key:"toxic_language",    clr:[234,88,12]},
      {label:"Hate Speech",       key:"hate_speech",       clr:[202,138,4]},
      {label:"Violence",          key:"violence",          clr:[185,28,28]},
      {label:"Extremism",         key:"extremism",         clr:[51,65,85]},
      {label:"Professional Risk", key:"professional_risk", clr:[220,38,38]},
    ];

    // Fixed zones (mm) — all relative to left margin
    const LBL = 46;   // label column width
    const SCR = 14;   // score "75%" width
    const PLW = 24;   // pill width
    const GAP = 4;    // gaps
    const BARW = W - m*2 - LBL - SCR - PLW - GAP*3;
    const RH = 12;    // row height

    cats.forEach((cat, i) => {
      guard(RH + 2);
      const ry = y;

      // Row background (every row, slight alternation)
      doc.setFillColor(i%2===0 ? 249 : 244, i%2===0 ? 250 : 247, i%2===0 ? 252 : 251);
      doc.roundedRect(m, ry, W-m*2, RH, 1.5, 1.5, "F");

      const score = Math.round((scores[cat.key]??0) as number);
      const tagC: [number,number,number] = score<30?[5,150,105]:score<60?[217,119,6]:[220,38,38];
      const tag = score<30?"AMAN":score<60?"SEDANG":score<80?"TINGGI":"KRITIS";

      // Label
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MID);
      doc.text(cat.label, m+3, ry+8);

      // Bar track
      const bx = m + LBL, by2 = ry+4, bh = 4;
      doc.setFillColor(...BDR);
      doc.roundedRect(bx, by2, BARW, bh, 1, 1, "F");
      if (score > 0) {
        doc.setFillColor(...cat.clr);
        doc.roundedRect(bx, by2, Math.max(2, (score/100)*BARW), bh, 1, 1, "F");
      }

      // Score number — right-aligned just before pill
      const scrX = bx + BARW + GAP;
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...tagC);
      doc.text(`${score}%`, scrX + SCR, ry+8, {align:"right"});

      // Status pill
      pill(tag, scrX + SCR + GAP, ry+3, tagC, WHITE, PLW);

      y += RH;
    });

    y += 10;

    // ════════════════════════════════════════════════════════════════════════
    // AI SUMMARY
    // ════════════════════════════════════════════════════════════════════════
    heading("AI SUMMARY");
    guard(20);
    const sumText  = safe(report.ai_summary ?? "Tidak ada ringkasan.");
    const sumLines = doc.splitTextToSize(sumText, W-m*2-14);
    const sumH     = Math.max(18, sumLines.length * 5.5 + 10);

    doc.setFillColor(...AC);
    doc.rect(m, y, 3, sumH, "F");
    doc.setFillColor(246,249,253);
    doc.roundedRect(m+3, y, W-m*2-3, sumH, 2, 2, "F");
    doc.setDrawColor(...BDR); doc.setLineWidth(0.2);
    doc.roundedRect(m+3, y, W-m*2-3, sumH, 2, 2, "S");
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(25,35,55);
    sumLines.forEach((l:string, idx:number) => {
      guard(6);
      doc.text(l, m+8, y+8+idx*5.5);
    });
    y += sumH + 10;

    // ════════════════════════════════════════════════════════════════════════
    // FLAGGED CONTENT
    // ════════════════════════════════════════════════════════════════════════
    heading(`KONTEN BERMASALAH (${flagged.length})`);

    if (flagged.length === 0) {
      guard(18);
      doc.setFillColor(209,250,229);
      doc.roundedRect(m, y, W-m*2, 18, 3, 3, "F");
      doc.setDrawColor(5,150,105); doc.setLineWidth(0.3);
      doc.roundedRect(m, y, W-m*2, 18, 3, 3, "S");
      // Green circle
      const gcx = m+13, gcy = y+9;
      doc.setFillColor(5,150,105);
      doc.circle(gcx, gcy, 5.5, "F");
      circleText("OK", gcx, gcy, 5.5, WHITE, 7.5);
      doc.setFont("helvetica","bold"); doc.setFontSize(9.5); doc.setTextColor(4,80,56);
      doc.text("Tidak ada konten bermasalah", m+23, y+8);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(4,100,70);
      doc.text("Kandidat lolos screening tanpa flag apapun.", m+23, y+14);
      y += 24;
    } else {
      flagged.forEach((f:any, i:number) => {
        const sev = (f.severity??"").toLowerCase();
        const isCrit   = sev==="kritis"||sev==="critical";
        const isHigh   = sev==="tinggi"||sev==="high";
        const isMed    = sev==="sedang"||sev==="medium";
        const sevC:[number,number,number] = isCrit?[153,27,27]:isHigh?[220,38,38]:isMed?[217,119,6]:[5,150,105];
        const sevLabel = isCrit?"KRITIS":isHigh?"TINGGI":isMed?"SEDANG":"RENDAH";

        const snipLines = f.content_snippet
          ? doc.splitTextToSize(safe(f.content_snippet), W-m*2-28)
          : [];
        const crdH = 18 + Math.min(snipLines.length, 3) * 5;
        guard(crdH + 5);

        // Card
        doc.setFillColor(...WHITE);
        doc.roundedRect(m, y, W-m*2, crdH, 2.5, 2.5, "F");
        doc.setDrawColor(...BDR); doc.setLineWidth(0.2);
        doc.roundedRect(m, y, W-m*2, crdH, 2.5, 2.5, "S");
        // Left strip
        doc.setFillColor(...sevC);
        doc.rect(m, y, 3, crdH, "F");

        // Number badge circle — cx, cy, r
        const nbCX = m+13, nbCY = y+9, nbR = 5;
        doc.setFillColor(...sevC);
        doc.circle(nbCX, nbCY, nbR, "F");
        circleText(String(i+1), nbCX, nbCY, nbR, WHITE, i < 9 ? 8 : 6.5);

        // Platform + category label
        doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...DARK);
        doc.text(`[${safe(f.platform??"").toUpperCase()}]  ${safe(f.category??"")}`, m+21, y+9);

        // Severity pill — top-right
        pill(sevLabel, W-m-PLW-2, y+3.5, sevC, WHITE, PLW);

        // Snippet
        if (snipLines.length > 0) {
          doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...MID);
          snipLines.slice(0,3).forEach((l:string, li:number) => {
            doc.text(l, m+21, y+15+(li*5));
          });
        }

        y += crdH + 5;
      });
    }

    y += 6;

    // ════════════════════════════════════════════════════════════════════════
    // HR ASSESSMENT DECISION
    // ════════════════════════════════════════════════════════════════════════
    if (report.assessment_status) {
      heading("KEPUTUSAN HR ASSESSMENT");
      guard(30);

      const isApp = report.assessment_status === "appropriate";
      const assC:[number,number,number]  = isApp ? [5,150,105]  : [220,38,38];
      const assBg:[number,number,number] = isApp ? [209,250,229] : [254,226,226];
      const assB:[number,number,number]  = isApp ? [52,211,153]  : [252,165,165];

      doc.setFillColor(...assBg);
      doc.roundedRect(m, y, W-m*2, 30, 3, 3, "F");
      doc.setDrawColor(...assB); doc.setLineWidth(0.5);
      doc.roundedRect(m, y, W-m*2, 30, 3, 3, "S");

      // Decision icon circle
      const icCX = m+17, icCY = y+15, icR = 10;
      doc.setFillColor(...assC);
      doc.circle(icCX, icCY, icR, "F");
      circleText(isApp?"OK":"X", icCX, icCY, icR, WHITE, 10);

      // Decision text
      doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...assC);
      doc.text(
        isApp ? "APPROPRIATE - LANJUT PROSES" : "INAPPROPRIATE - TIDAK DILANJUTKAN",
        m+31, y+13
      );
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MID);
      doc.text(`Dinilai oleh : ${safe(report.assessed_by_name??"-")}`, m+31, y+21);
      doc.text(`Waktu        : ${report.assessed_at ? new Date(report.assessed_at).toLocaleString("id-ID") : "-"}`, m+31, y+28);

      y += 36;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FOOTER — every page
    // ════════════════════════════════════════════════════════════════════════
    const totalPg = doc.getNumberOfPages();
    for (let p = 1; p <= totalPg; p++) {
      doc.setPage(p);
      doc.setDrawColor(...BDR); doc.setLineWidth(0.25);
      doc.line(m, H-13, W-m, H-13);
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...AC);
      doc.text("HRCheck", m, H-7);
      doc.setFont("helvetica","normal"); doc.setTextColor(...LIGHT);
      doc.text("  AI Recruitment Platform  |  Dokumen Rahasia & Terbatas", m+20, H-7);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...LIGHT);
      doc.text(`Hal. ${p} / ${totalPg}`, W-m, H-7, {align:"right"});
      // Watermark
      doc.setGState(new (doc as any).GState({opacity:0.03}));
      doc.setFont("helvetica","bold"); doc.setFontSize(44); doc.setTextColor(60,60,60);
      doc.text("HRCHECK CONFIDENTIAL", W/2, H/2, {align:"center", angle:40});
      doc.setGState(new (doc as any).GState({opacity:1}));
    }

    doc.save(`HRCheck_${candidate.full_name.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
  };


  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([api.getCandidate(id), api.getReport(id)]);
      setCandidate(c);
      setReport(r);
    } catch {
      try { setCandidate(await api.getCandidate(id)); } catch {}
    } finally { setLoading(false); }
  }, [id]);

  // Auto-refresh every 4s while processing
  useEffect(() => {
    load();
    const iv = setInterval(async () => {
      try {
        const r = await api.getReport(id);
        setReport(r);
        if (r.status === "completed" || r.status === "failed") clearInterval(iv);
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [id, load]);

  // Elapsed timer for processing state
  useEffect(() => {
    if (!report || report.status === "completed" || report.status === "failed") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [report?.status]);

  if (loading)
    return (
      <AppLayout>
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text3)", fontSize: 14 }}>
            <Loader2 size={20} className="animate-spin" />
            Memuat data kandidat...
          </div>
        </div>
      </AppLayout>
    );

  const isProcessing = !report || report.status === "pending" || report.status === "processing";
  const riskScores = report?.risk_scores ?? {};
  const flagged = report?.flagged_content ?? [];
  const profiles = report?.found_profiles ?? {};
  const overallRisk = report?.overall_risk ?? "low";

  const socials = [
    { url: normalizeSocialUrl(candidate?.instagram_url, "instagram"), Icon: Camera,        color: "#e1306c", label: "Instagram" },
    { url: normalizeSocialUrl(candidate?.twitter_url,   "twitter"),   Icon: MessageCircle, color: "#1d9bf0", label: "Twitter/X" },
    { url: normalizeSocialUrl(candidate?.facebook_url,  "facebook"),  Icon: Globe,         color: "#1877f2", label: "Facebook"  },
    { url: normalizeSocialUrl(candidate?.linkedin_url,  "linkedin"),  Icon: Link2,         color: "#0077b5", label: "LinkedIn"  },
  ].filter(x => x.url);

  return (
    <AppLayout>
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 60px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 0" }}>

          {/* Back */}
          <Link href="/candidates" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: "var(--text3)",
            textDecoration: "none", marginBottom: 24,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          >
            <ArrowLeft size={13} /> Semua Kandidat
          </Link>

          {/* Header card */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "24px 28px",
            boxShadow: "var(--sh-sm)", marginBottom: 16,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Avatar */}
              <div style={{
                width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), #009e76)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#04130f",
                boxShadow: "0 6px 20px var(--accent-g)",
              }}>
                {candidate?.full_name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
                  {candidate?.full_name}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--text3)" }}>
                    <Mail size={12} style={{ color: "var(--accent)" }} />
                    {candidate?.email}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--text3)" }}>
                    <Phone size={12} style={{ color: "var(--accent)" }} />
                    {candidate?.phone}
                  </span>
                </div>
                {/* Socials */}
                {socials.length > 0 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {socials.map(({ url, Icon, color, label }, i) => (
                      <a key={i} href={url!} target="_blank" rel="noopener noreferrer"
                        title={label}
                        style={{
                          width: 32, height: 32, borderRadius: 10, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: "var(--bg3)", border: "1px solid var(--border)",
                          color, transition: "all 0.15s", textDecoration: "none",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.borderColor = color; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <Icon size={14} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Risk badge or processing */}
            {isProcessing ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--warn-d)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 12, padding: "8px 14px",
                }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--warning)" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--warning)" }}>
                    {report?.status === "pending" ? "Menunggu..." : "Sedang diproses"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> {elapsed}s • auto-refresh tiap 4 detik
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Risk Overall</p>
                <RiskBadge level={overallRisk} large />

                {/* Download button */}
                <button onClick={handleDownload} style={{
                  marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  color: "var(--text2)", cursor: "pointer", transition: "all 0.15s", marginLeft: "auto",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
                >
                  <Download size={12} /> Download Report
                </button>
              </div>
            )}
          </div>

          {/* Processing banner */}
          {isProcessing && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "28px 28px",
              boxShadow: "var(--sh-sm)", marginBottom: 16,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 14, textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--accent-d)", border: "2px solid var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldAlert size={24} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 6 }}>
                  AI Screening Berjalan
                </p>
                <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6, maxWidth: 420 }}>
                  Sistem sedang menganalisis profil sosial media kandidat. Proses ini biasanya memakan waktu 1–3 menit. Halaman akan otomatis diperbarui.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["Instagram", "Twitter/X", "Facebook", "LinkedIn", "Google", "Berita"].map(p => (
                  <span key={p} style={{
                    fontSize: 11.5, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
                    background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Loader2 size={10} className="animate-spin" style={{ opacity: 0.5 }} />
                    {p}
                  </span>
                ))}
              </div>
              <button onClick={load} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 10,
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text3)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
              >
                <RefreshCw size={13} /> Refresh Manual
              </button>
            </div>
          )}

          {/* Results */}
          {!isProcessing && report?.status === "completed" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 4 }}>
                {(["overview", "details", "flags"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                    background: tab === t ? "var(--accent)" : "transparent",
                    color: tab === t ? "#04130f" : "var(--text3)",
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12.5,
                    cursor: "pointer", transition: "all 0.18s", textTransform: "capitalize",
                    letterSpacing: "-0.01em",
                  }}>
                    {t === "overview" ? "Ringkasan" : t === "details" ? "Skor Risiko" : `Konten Flagged ${flagged.length > 0 ? `(${flagged.length})` : ""}`}
                  </button>
                ))}
              </div>

              {/* Assessment Panel (No. 1 BCA) */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 18, padding: "20px 24px", marginBottom: 16,
                boxShadow: "var(--sh-sm)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                  Keputusan Assessment HR
                </p>

                {report.assessment_status ? (
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        background: report.assessment_status === "appropriate" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                        border: `1px solid ${report.assessment_status === "appropriate" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`,
                      }}>
                        {report.assessment_status === "appropriate"
                          ? <ThumbsUp size={18} style={{ color: "#22c55e" }} />
                          : <ThumbsDown size={18} style={{ color: "#ef4444" }} />}
                      </div>
                      <div>
                        <p style={{
                          fontWeight: 700, fontSize: 15,
                          color: report.assessment_status === "appropriate" ? "#22c55e" : "#ef4444",
                          marginBottom: 3,
                        }}>
                          {report.assessment_status === "appropriate" ? "✅ Appropriate" : "❌ Inappropriate"}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                            <User size={11} /> {report.assessed_by_name ?? "-"} ({report.assessed_by ?? "-"})
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                            <Calendar size={11} /> {report.assessed_at ? new Date(report.assessed_at).toLocaleString("id-ID") : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setReport({ ...report, assessment_status: undefined as any })} style={{
                      fontSize: 11.5, padding: "5px 12px", borderRadius: 8,
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      color: "var(--text3)", cursor: "pointer",
                    }}>Ubah</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      disabled={assessing}
                      onClick={() => handleAssess("appropriate")}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                        borderRadius: 12, border: "1px solid rgba(34,197,94,0.4)",
                        background: "rgba(34,197,94,0.08)", color: "#22c55e",
                        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        opacity: assessing ? 0.6 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
                    >
                      <ThumbsUp size={14} /> Appropriate
                    </button>
                    <button
                      disabled={assessing}
                      onClick={() => handleAssess("inappropriate")}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                        borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)",
                        background: "rgba(239,68,68,0.08)", color: "#ef4444",
                        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        opacity: assessing ? 0.6 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    >
                      <ThumbsDown size={14} /> Inappropriate
                    </button>
                    {assessing && <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)", alignSelf: "center" }} />}
                  </div>
                )}
              </div>

              {/* Overview */}
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* AI Summary */}
                  {report.ai_summary && (
                    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>AI Summary</p>
                      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.75 }}>{report.ai_summary}</p>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--bg3)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
                        <p style={{ fontSize: 11.5, color: "var(--text4)", lineHeight: 1.6, margin: 0 }}>
                          Ringkasan ini dihasilkan AI berdasarkan data publik yang berhasil di-scrape. Akurasi bergantung pada ketersediaan dan kelengkapan data, bukan kesimpulan final. Tetap diperlukan penilaian manual dari HR.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Found profiles */}
                  {Object.keys(profiles).length > 0 && (
                    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Profil Ditemukan</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.entries(profiles).map(([platform, url]) => {
                          const key = platform.toLowerCase();
                          const Icon  = PLATFORM_ICONS[key] ?? Globe;
                          const color = PLATFORM_COLORS[key] ?? "var(--accent)";
                          const normalizedUrl = normalizeSocialUrl(url as string, key) ?? (url as string);
                          const displayHandle = (() => {
                            try {
                              const u = new URL(normalizedUrl);
                              const parts = u.pathname.replace(/\//g, " ").trim().split(" ").filter(Boolean);
                              return "@" + parts[parts.length - 1];
                            } catch { return url as string; }
                          })();
                          const platformLabel = key === "google_results" ? "Google" : key.charAt(0).toUpperCase() + key.slice(1);
                          return (
                            <a key={platform} href={normalizedUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 14px", borderRadius: 12,
                              background: "var(--bg3)", border: "1px solid var(--border)",
                              textDecoration: "none", transition: "all 0.15s",
                            }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = "var(--accent-d)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg3)"; }}
                            >
                              <Icon size={15} style={{ color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", flex: 1 }}>{platformLabel}</span>
                              <span style={{ fontSize: 11.5, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{displayHandle}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Skor risiko */}
              {tab === "details" && (
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>Skor Per Kategori</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Object.entries(riskScores).map(([key, score]) => {
                      const info = RISK_LABELS[key];
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                              {info?.icon} {info?.label ?? key}
                            </span>
                            <span style={{ fontSize: 11.5, color: "var(--text3)" }}>{info?.desc}</span>
                          </div>
                          <ScoreBar score={score} />
                        </div>
                      );
                    })}
                    {Object.keys(riskScores).length === 0 && (
                      <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", padding: "20px 0" }}>Tidak ada skor risiko tersedia.</p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 20, padding: "10px 12px", borderRadius: 10, background: "var(--bg3)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: 11.5, color: "var(--text4)", lineHeight: 1.6, margin: 0 }}>
                      Skor dihitung AI dari data yang berhasil dikumpulkan. Platform seperti Instagram & Facebook sering membatasi akses publik, jika data minim, skor mungkin tidak representatif. Gunakan sebagai indikasi awal, bukan penilaian mutlak.
                    </p>
                  </div>
                </div>
              )}

              {/* Flagged content */}
              {tab === "flags" && (
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>Konten Bermasalah</p>
                  {flagged.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 0", color: "var(--text3)" }}>
                      <CheckCircle size={32} style={{ color: "var(--accent)" }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Tidak ada konten bermasalah</p>
                      <p style={{ fontSize: 13 }}>Kandidat ini lolos screening tanpa flag.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {flagged.map((f, i) => {
                        const platformColor: Record<string, string> = {
                          instagram: "#e1306c", twitter: "#1d9bf0", facebook: "#1877f2",
                          linkedin: "#0077b5", "google search": "#4285f4", "berita media": "#f59e0b",
                          google: "#4285f4", news: "#f59e0b",
                        };
                        const pKey = (f.platform ?? "").toLowerCase();
                        const pColor = platformColor[pKey] ?? "var(--danger)";
                        const hasUrl = f.source_url && f.source_url.startsWith("http");
                        return (
                          <div key={i} style={{
                            padding: "14px 16px", borderRadius: 14,
                            background: "var(--danger-d)", border: "1px solid rgba(239,68,68,0.15)",
                            transition: "border-color 0.15s",
                          }}>
                            {/* Header row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <AlertTriangle size={13} style={{ color: "var(--danger)", flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: pColor, textTransform: "capitalize" }}>{f.platform}</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "var(--danger)", fontWeight: 600 }}>{f.category}</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "var(--bg3)", color: "var(--text3)", fontWeight: 600, marginLeft: "auto" }}>{f.severity}</span>
                            </div>
                            {/* Snippet */}
                            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: hasUrl ? 10 : 0 }}>{f.content_snippet}</p>
                            {/* Evidence button */}
                            {hasUrl && (() => {
                              const isGoogleSearch = f.source_url?.includes("google.com/search");
                              let domain = "";
                              try { domain = new URL(f.source_url).hostname.replace("www.", ""); } catch {}
                              const btnLabel = f.source_label
                                ? f.source_label
                                : isGoogleSearch
                                  ? "Cari Bukti di Google"
                                  : domain ? `Lihat di ${domain}` : "Lihat Bukti";
                              return (
                                <a
                                  href={f.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "5px 12px", borderRadius: 8,
                                    background: isGoogleSearch ? "rgba(66,133,244,0.1)" : "var(--bg3)",
                                    border: isGoogleSearch ? "1px solid rgba(66,133,244,0.3)" : `1px solid ${pColor}40`,
                                    color: isGoogleSearch ? "#4285f4" : pColor,
                                    fontSize: 11.5, fontWeight: 600,
                                    textDecoration: "none", transition: "all 0.15s",
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                                >
                                  <ExternalLink size={11} />
                                  {btnLabel}
                                </a>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Failed */}
          {report?.status === "failed" && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 18, padding: "32px 28px", boxShadow: "var(--sh-sm)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
            }}>
              <AlertTriangle size={32} style={{ color: "var(--danger)" }} />
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Screening Gagal</p>
              <p style={{ fontSize: 13, color: "var(--text3)" }}>{report.error_message ?? "Terjadi kesalahan saat proses screening."}</p>
              <button onClick={load} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 20px",
                borderRadius: 10, background: "var(--danger-d)", border: "1px solid rgba(239,68,68,0.2)",
                color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                <RefreshCw size={13} /> Coba Lagi
              </button>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}