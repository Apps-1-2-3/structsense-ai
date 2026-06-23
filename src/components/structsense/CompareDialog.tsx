import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, TrendingUp, Upload, X, Loader2, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnalysisResult, analyzeImage, scoreColor } from "@/lib/structsense";
import { RiskBadge } from "./RiskBadge";

interface Slot {
  url: string | null;
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}
const empty: Slot = { url: null, result: null, loading: false, error: null };

export function CompareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [before, setBefore] = useState<Slot>(empty);
  const [after, setAfter] = useState<Slot>(empty);

  async function pick(side: "before" | "after", file: File) {
    const setter = side === "before" ? setBefore : setAfter;
    setter({ url: URL.createObjectURL(file), result: null, loading: true, error: null });
    try {
      const result = await analyzeImage(file);
      setter((s) => ({ ...s, result, loading: false }));
    } catch (e) {
      setter((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Failed" }));
    }
  }

  function reset() {
    setBefore(empty);
    setAfter(empty);
  }

  const delta = before.result && after.result
    ? after.result.overallHealthScore - before.result.overallHealthScore
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-5xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Compare Two Images</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Slot label="Before" slot={before} onPick={(f) => pick("before", f)} />
          <div className="flex items-center justify-center text-muted-foreground">
            <ArrowRight className="size-6" />
          </div>
          <Slot label="After" slot={after} onPick={(f) => pick("after", f)} />
        </div>

        {before.result && after.result && delta !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 grid grid-cols-3 gap-4 rounded-2xl border border-border bg-background/40 p-5"
          >
            <Score label="Before" score={before.result.overallHealthScore} risk={before.result.healthSummary.loadBearingRisk} />
            <DeltaCard delta={delta} />
            <Score label="After" score={after.result.overallHealthScore} risk={after.result.healthSummary.loadBearingRisk} />
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Slot({ label, slot, onPick }: { label: string; slot: Slot; onPick: (f: File) => void }) {
  return (
    <label className="flex h-64 cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-dashed border-border bg-background/40 transition hover:border-primary/60">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {slot.result && (
          <span className="tabular-nums" style={{ color: scoreColor(slot.result.overallHealthScore) }}>
            {slot.result.overallHealthScore}
          </span>
        )}
      </div>
      <div className="relative flex-1">
        {slot.url ? (
          <>
            <img src={slot.url} alt={label} className="h-full w-full object-contain" />
            {slot.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-primary">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Upload className="size-6" />
            Click to upload {label.toLowerCase()}
          </div>
        )}
      </div>
      {slot.error && (
        <div className="border-t border-danger/40 bg-danger/10 px-3 py-1 text-xs text-danger">
          {slot.error}
        </div>
      )}
    </label>
  );
}

function Score({ label, score, risk }: { label: string; score: number; risk: AnalysisResult["healthSummary"]["loadBearingRisk"] }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="my-1 text-4xl font-bold tabular-nums" style={{ color: scoreColor(score) }}>{score}</div>
      <div className="flex justify-center"><RiskBadge risk={risk} size="sm" /></div>
    </div>
  );
}

function DeltaCard({ delta }: { delta: number }) {
  const improved = delta > 0;
  const same = delta === 0;
  const color = same ? "#8b949e" : improved ? "#22C55E" : "#EF4444";
  const Icon = same ? Minus : improved ? TrendingUp : TrendingDown;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/60 p-3 text-center">
      <Icon className="size-6" style={{ color }} />
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>
        {delta > 0 ? "+" : ""}{delta}
      </div>
      <div className="text-xs font-medium" style={{ color }}>
        {same ? "No change" : improved ? "Improvement" : "Deterioration"}
      </div>
    </div>
  );
}

// Keep import to avoid lint
void X;
