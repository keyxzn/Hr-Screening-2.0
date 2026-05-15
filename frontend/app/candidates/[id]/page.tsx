"use client";

import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import AppLayout from "@/components/AppLayout";
import { useParams } from "next/navigation";
import Link from "next/link";

import RiskBadge from "@/components/RiskBadge";
import {
  api,
  Candidate,
  ScreeningReport,
} from "@/lib/api";

import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Instagram,
  Twitter,
  Globe,
  Linkedin,
  Newspaper,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Mail,
  Phone,
} from "lucide-react";

const RISK_LABELS: Record<
  string,
  {
    label: string;
    icon: string;
    desc: string;
  }
> = {
  explicit_content: {
    label: "Explicit Content",
    icon: "🔞",
    desc: "Pornografi / konten vulgar",
  },

  toxic_language: {
    label: "Toxic Language",
    icon: "🤬",
    desc: "Kata kasar, bullying, harassment",
  },

  hate_speech: {
    label: "Hate Speech",
    icon: "🚫",
    desc: "Serangan ras, agama, gender",
  },

  violence: {
    label: "Violence",
    icon: "💢",
    desc: "Ancaman kekerasan",
  },

  extremism: {
    label: "Extremism",
    icon: "☢️",
    desc: "Terorisme / kekerasan politik",
  },

  professional_risk: {
    label: "Professional Risk",
    icon: "💼",
    desc: "Fraud, scam, fake profile",
  },
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Globe,
  linkedin: Linkedin,
  google: Globe,
  news: Newspaper,
};

function ScoreBar({
  score,
}: {
  score: number;
}) {
  const color =
    score < 25
      ? "bg-emerald-500"
      : score < 50
      ? "bg-amber-400"
      : score < 75
      ? "bg-orange-500"
      : "bg-red-600";

  return (
    <div className="flex items-center gap-2.5">

      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <span
        className={`text-xs font-bold w-8 text-right ${
          score < 25
            ? "text-emerald-600"
            : score < 50
            ? "text-amber-600"
            : "text-red-600"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [report, setReport] =
    useState<ScreeningReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [tab, setTab] = useState<
    "overview" | "details" | "flags"
  >("overview");

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([
        api.getCandidate(id),
        api.getReport(id),
      ]);

      setCandidate(c);
      setReport(r);

    } catch {
      try {
        setCandidate(
          await api.getCandidate(id)
        );
      } catch {}

    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();

    const iv = setInterval(async () => {
      try {
        const r = await api.getReport(id);

        setReport(r);

        if (
          r.status === "completed" ||
          r.status === "failed"
        ) {
          clearInterval(iv);
        }

      } catch {}
    }, 3000);

    return () => clearInterval(iv);

  }, [id, load]);

  if (loading)
    return (
      <AppLayout>
        <div className="min-h-screen bg-slate-50">
          <div className="flex items-center justify-center py-32 text-slate-400">
            <Loader2
              size={24}
              className="animate-spin mr-3"
            />

            Memuat data kandidat...
          </div>
        </div>
      </AppLayout>
    );

  const isProcessing =
    !report ||
    report.status === "pending" ||
    report.status === "processing";

  const riskScores =
    report?.risk_scores ?? {};

  const flagged =
    report?.flagged_content ?? [];

  const profiles =
    report?.found_profiles ?? {};

  const overallRisk =
    report?.overall_risk ?? "low";

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* BACK */}
          <Link
            href="/candidates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft size={13} />
            Semua Kandidat
          </Link>

          {/* HEADER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4 flex items-start justify-between gap-4 flex-wrap">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
                {candidate?.full_name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {candidate?.full_name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">

                  <span className="flex items-center gap-1">
                    <Mail size={11} />
                    {candidate?.email}
                  </span>

                  <span className="flex items-center gap-1">
                    <Phone size={11} />
                    {candidate?.phone}
                  </span>

                </div>

                {/* SOCIAL */}
                <div className="flex gap-2 mt-2.5">

                  {[
                    {
                      url: candidate?.instagram_url,
                      Icon: Instagram,
                      color: "text-pink-500",
                    },

                    {
                      url: candidate?.twitter_url,
                      Icon: Twitter,
                      color: "text-sky-500",
                    },

                    {
                      url: candidate?.facebook_url,
                      Icon: Globe,
                      color: "text-blue-600",
                    },

                    {
                      url: candidate?.linkedin_url,
                      Icon: Linkedin,
                      color: "text-blue-700",
                    },

                  ]
                    .filter((x) => x.url)
                    .map(
                      (
                        {
                          url,
                          Icon,
                          color,
                        },
                        i
                      ) => (
                        <a
                          key={i}
                          href={url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg bg-slate-50 border border-slate-200 ${color} hover:scale-110 transition`}
                        >
                          <Icon size={13} />
                        </a>
                      )
                    )}

                </div>
              </div>
            </div>

            {/* OVERALL RISK */}
            {!isProcessing && (
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Risk Overall
                </p>

                <RiskBadge
                  level={overallRisk}
                  large
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}