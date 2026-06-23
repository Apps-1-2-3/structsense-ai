import { HistoryEntry, scoreColor } from "@/lib/structsense";
import { HealthTrendChart } from "./HealthTrendChart";


export function HistoryTable({
  entries,
  onSelect,
}: {
  entries: HistoryEntry[];
  onSelect: (e: HistoryEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        No analyses yet. Upload an image to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-background/60 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Image</th>
            <th className="px-4 py-3 text-left font-semibold">Structure</th>
            <th className="px-4 py-3 text-left font-semibold">Score</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const c = scoreColor(e.result.overallHealthScore);
            return (
              <tr
                key={e.id}
                onClick={() => onSelect(e)}
                className="cursor-pointer border-t border-border/60 transition hover:bg-background/40"
              >
                <td className="px-4 py-3">
                  <img src={e.thumbnail} alt="" className="size-12 rounded-md object-cover" />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{e.result.structureType}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold tabular-nums" style={{ color: c }}>
                    {e.result.overallHealthScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: `${c}22`, color: c }}
                  >
                    {e.result.healthStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(e.date).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
