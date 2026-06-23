import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { scoreColor } from "@/lib/structsense";

export function HealthGauge({ score, status }: { score: number; status: string }) {
  const color = scoreColor(score);
  const data = [{ name: "score", value: score, fill: color }];

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="78%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#1f2733" }} dataKey="value" cornerRadius={16} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold tabular-nums" style={{ color }}>
          {score}
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Health Score</div>
        <div className="mt-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${color}22`, color }}>
          {status}
        </div>
      </div>
    </div>
  );
}
