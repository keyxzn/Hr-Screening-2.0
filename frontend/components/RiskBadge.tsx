export default function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label:string; bg:string; color:string }> = {
    low:      { label:"Rendah", bg:"var(--succ-d)",   color:"var(--success)" },
    medium:   { label:"Sedang", bg:"var(--warn-d)",   color:"var(--warning)" },
    high:     { label:"Tinggi", bg:"var(--danger-d)", color:"var(--danger)"  },
    critical: { label:"Kritis", bg:"rgba(127,0,0,0.12)", color:"#ef4444"    },
  };
  const c = map[level] ?? { label:level, bg:"var(--bg3)", color:"var(--text3)" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.color,
      fontSize:11, fontWeight:700, padding:"4px 10px",
      borderRadius:999, letterSpacing:"0.01em", fontFamily:"'Syne',sans-serif",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.color, flexShrink:0 }} />
      {c.label}
    </span>
  );
}
