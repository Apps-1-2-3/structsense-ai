import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, HardHat, Wrench, ListChecks } from "lucide-react";
import {
  AnalysisResult,
  loadChecklistState,
  saveChecklistState,
  severityColor,
  riskColor,
} from "@/lib/structsense";

const PHASES = [
  { key: "immediate", label: "Immediate", sub: "0–7 days", color: "#EF4444" },
  { key: "short", label: "Short-term", sub: "1–3 months", color: "#F59E0B" },
  { key: "long", label: "Long-term", sub: "6–12 months", color: "#00C9A7" },
];

function bucketFor(timeline: string): number {
  const t = timeline.toLowerCase();
  if (t.includes("hour") || t.includes("7 day") || t.includes("48")) return 0;
  if (t.includes("14 day") || t.includes("30 day") || t.includes("month")) return 1;
  return 2;
}

export function MaintenancePanel({ result }: { result: AnalysisResult }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked(loadChecklistState());
  }, []);

  function toggle(method: string) {
    const next = { ...checked, [method]: !checked[method] };
    setChecked(next);
    saveChecklistState(next);
  }

  const risk = result.healthSummary.loadBearingRisk;
  const riskC = riskColor(risk);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Structural Health Summary
          </h3>
          <span
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: `${riskC}22`, color: riskC, border: `1px solid ${riskC}44` }}
          >
            Load-bearing: {risk}
          </span>
        </div>
        <p className="text-base text-foreground/90">{result.healthSummary.conditionSentence}</p>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" /> {result.healthSummary.inspectionFrequency}
        </p>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Clock className="size-4" /> Maintenance Schedule
        </div>
        <div className="relative px-2">
          <div className="absolute left-0 right-0 top-3 h-0.5 bg-border" />
          <div className="relative grid grid-cols-3 gap-4">
            {PHASES.map((p, idx) => {
              const items = result.maintenancePlan.filter((m) => bucketFor(m.urgencyTimeline) === idx);
              return (
                <div key={p.key} className="flex flex-col items-center text-center">
                  <div
                    className="z-10 size-6 rounded-full border-4 border-card"
                    style={{ background: p.color }}
                  />
                  <div className="mt-3 text-sm font-semibold" style={{ color: p.color }}>
                    {p.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.sub}</div>
                  <div className="mt-3 space-y-1.5">
                    {items.length === 0 ? (
                      <div className="text-xs italic text-muted-foreground/60">No actions</div>
                    ) : (
                      items.map((i) => (
                        <div
                          key={i.distressName}
                          className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs text-foreground/80"
                        >
                          {i.distressName}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Repair cards */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Wrench className="size-4" /> Repair Action Plan
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.maintenancePlan.map((item) => {
            const distress = result.distressTypes.find((d) => d.name === item.distressName);
            const sevColor = distress ? severityColor(distress.severity) : "#00C9A7";
            return (
              <div key={item.distressName} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{item.distressName}</h4>
                  {distress && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: `${sevColor}22`, color: sevColor }}
                    >
                      {distress.severity}
                    </span>
                  )}
                </div>

                <Row label="Immediate" value={item.immediateAction} />
                <Row label="Repair method" value={item.repairMethod} />
                <Row label="Timeline" value={item.urgencyTimeline} accent />

                <div className="mt-3">
                  <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                    Materials
                  </div>
                  <ul className="grid grid-cols-1 gap-1 text-sm text-foreground/85 sm:grid-cols-2">
                    {item.materialsNeeded.map((m) => (
                      <li key={m} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  <HardHat className="size-3.5" />
                  {item.requiresEngineer ? (
                    <span className="rounded-md bg-danger/15 px-2 py-1 font-semibold text-danger">
                      Licensed structural engineer required
                    </span>
                  ) : (
                    <span className="rounded-md bg-safe/15 px-2 py-1 font-semibold text-safe">
                      Can be performed by qualified maintenance crew
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NDT checklist */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <ListChecks className="size-4" /> NDT Follow-up Checklist
        </div>
        <div className="space-y-2">
          {result.ndtChecklist.map((item) => {
            const on = !!checked[item.method];
            return (
              <button
                key={item.method}
                type="button"
                onClick={() => toggle(item.method)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  on
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-background/40 hover:border-primary/30"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {on && (
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M3 8.5L7 12L13 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <div className={`font-semibold ${on ? "text-primary" : "text-foreground"}`}>
                    {item.method}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mb-2">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm ${accent ? "font-semibold text-primary" : "text-foreground/90"}`}>
        {value}
      </div>
    </div>
  );
}
