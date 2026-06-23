import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Activity, ClipboardList, Wrench, Download } from "lucide-react";
import {
  AnalysisResult,
  DistressType,
  severityColor,
  generatePdfReport,
} from "@/lib/structsense";
import { HealthGauge } from "./HealthGauge";
import { RiskBadge } from "./RiskBadge";


function SeverityBadge({ severity }: { severity: DistressType["severity"] }) {
  const c = severityColor(severity);
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${c}22`, color: c }}
    >
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: AnalysisResult["maintenancePriority"] }) {
  const map: Record<string, string> = {
    Immediate: "#EF4444",
    "Short-term": "#F59E0B",
    Routine: "#00C9A7",
    None: "#22C55E",
  };
  const c = map[priority] ?? "#00C9A7";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
      style={{ background: `${c}1f`, color: c, border: `1px solid ${c}44` }}
    >
      <Activity className="size-3.5" />
      {priority}
    </span>
  );
}

export function ResultsDashboard({ result }: { result: AnalysisResult }) {
  return (
    <motion.div
      key={result.structureType + result.overallHealthScore}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {result.safetyAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger">
          <ShieldAlert className="size-5 shrink-0" />
          <div className="text-sm font-semibold">
            Safety Alert — restrict access and consult a licensed structural engineer immediately.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Structure</div>
              <div className="text-lg font-semibold text-foreground">{result.structureType}</div>
            </div>
            <RiskBadge risk={result.healthSummary.loadBearingRisk} />
          </div>
          <div className="mt-3">
            <HealthGauge score={result.overallHealthScore} status={result.healthStatus} />
          </div>
          <button
            type="button"
            onClick={() => generatePdfReport(result)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            <Download className="size-4" /> Download PDF Report
          </button>
        </div>


        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Detected Distress
            </h3>
            <PriorityBadge priority={result.maintenancePriority} />
          </div>
          <div className="space-y-3">
            {result.distressTypes.map((d) => (
              <div key={d.name} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="font-semibold text-foreground">{d.name}</div>
                  <SeverityBadge severity={d.severity} />
                </div>
                <div className="mb-3 text-xs text-muted-foreground">{d.location}</div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.confidence}%`,
                        background: severityColor(d.severity),
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {d.confidence}%
                  </div>
                </div>
              </div>
            ))}
            {result.distressTypes.length === 0 && (
              <div className="rounded-xl bg-safe/10 p-4 text-sm text-safe">
                No distress detected.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <ClipboardList className="size-4" /> Recommendations
          </div>
          <ol className="space-y-2.5">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/90">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <Wrench className="size-4" /> Suggested NDE Method
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            {result.ndeMethodSuggested}
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <AlertTriangle className="size-4" /> Load-bearing Risk
            </div>
            <RiskBadge risk={result.healthSummary.loadBearingRisk} />

            <p className="mt-3 text-sm text-foreground/80">{result.healthSummary.conditionSentence}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Inspection cadence: {result.healthSummary.inspectionFrequency}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
