const cfg = {
  low:      { label:"Rendah",  bg:"rgba(34,197,94,0.12)",   text:"#16a34a", dot:"#22c55e",  border:"rgba(34,197,94,0.25)"  },
  medium:   { label:"Sedang",  bg:"rgba(245,158,11,0.12)",  text:"#d97706", dot:"#f59e0b",  border:"rgba(245,158,11,0.25)" },
  high:     { label:"Tinggi",  bg:"rgba(239,68,68,0.12)",   text:"#dc2626", dot:"#ef4444",  border:"rgba(239,68,68,0.25)"  },
  critical: { label:"Kritis",  bg:"rgba(127,29,29,0.15)",   text:"#b91c1c", dot:"#7f1d1d",  border:"rgba(185,28,28,0.3)"   },
};
export default function RiskBadge({ level, large }: { level:string; large?:boolean }) {
  const c = cfg[level as keyof typeof cfg] ?? cfg.low;
  return (
    <span style={{background:c.bg, color:c.text, border:`1px solid ${c.border}`}}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${large?"px-3 py-1.5 text-[13px]":"px-2.5 py-1 text-[11px]"}`}>
      <span className="rounded-full animate-[pulse-dot_2s_ease-in-out_infinite]" style={{background:c.dot, width:large?7:5, height:large?7:5, display:"inline-block"}}/>
      {c.label}
    </span>
  );
}