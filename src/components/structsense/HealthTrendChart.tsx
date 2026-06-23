import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { HistoryEntry } from "@/lib/structsense";

export function HealthTrendChart({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length < 2) return null;

  const data = [...entries]
    .reverse()
    .map((e, i) => ({
      idx: i + 1,
      date: new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: e.result.overallHealthScore,
      structure: e.result.structureType,
    }));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Health Score Trend
        </h3>
        <span className="text-xs text-muted-foreground">{entries.length} sessions</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis dataKey="date" stroke="#8b949e" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#8b949e" fontSize={11} />
            <ReferenceLine y={70} stroke="#22C55E" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: "#161B22", border: "1px solid #30363d", borderRadius: 8, color: "#E6EDF3" }}
              labelStyle={{ color: "#8b949e" }}
              formatter={(v: number, _n, p) => [`${v} — ${p.payload.structure}`, "Score"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#00C9A7"
              strokeWidth={2.5}
              dot={{ fill: "#00C9A7", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
