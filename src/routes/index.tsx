import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Cpu, History, Wrench, ScanLine } from "lucide-react";

import { UploadPanel } from "@/components/structsense/UploadPanel";
import { ResultsDashboard } from "@/components/structsense/ResultsDashboard";
import { MaintenancePanel } from "@/components/structsense/MaintenancePanel";
import { HistoryTable } from "@/components/structsense/HistoryTable";
import {
  AnalysisResult,
  HistoryEntry,
  analyzeImage,
  loadHistory,
  pingHealth,
  saveToHistory,
} from "@/lib/structsense";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StructSense — Local AI Structural Health Monitor" },
      {
        name: "description",
        content:
          "Upload an image of a civil structure to get an AI-powered condition score, distress detection, repair plan, and NDT checklist — running fully locally.",
      },
      { property: "og:title", content: "StructSense — Local AI Structural Health Monitor" },
      {
        property: "og:description",
        content:
          "AI-powered Structural Health Monitoring image analyzer. Local FastAPI inference, no cloud.",
      },
    ],
  }),
  component: StructSenseApp,
});

type Tab = "results" | "maintenance" | "history";

function StructSenseApp() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("results");

  useEffect(() => {
    pingHealth().then(setBackendUp);
    setHistory(loadHistory());
  }, []);

  const showMaintenance = useMemo(
    () => !!result && result.healthStatus !== "Excellent" && result.healthStatus !== "Good",
    [result],
  );

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setAnalyzing(true);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setTab("results");
    try {
      const res = await analyzeImage(file);
      setResult(res);
      const thumb = await fileToDataUrl(file, 96);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        thumbnail: thumb,
        result: res,
      };
      saveToHistory(entry);
      setHistory(loadHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Is the backend running?");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSelectHistory(entry: HistoryEntry) {
    setResult(entry.result);
    setPreviewUrl(entry.thumbnail);
    setTab("results");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ScanLine className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">StructSense</h1>
              <p className="text-xs text-muted-foreground">
                Local AI Structural Health Monitoring
              </p>
            </div>
          </div>
          <BackendStatus up={backendUp} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Left 40% */}
          <section>
            <UploadPanel previewUrl={previewUrl} isAnalyzing={isAnalyzing} onFile={handleFile} />
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>{error}</div>
              </div>
            )}
          </section>

          {/* Right 60% */}
          <section className="min-h-[600px]">
            <Tabs
              tab={tab}
              setTab={setTab}
              hasResult={!!result}
              showMaintenance={showMaintenance}
              historyCount={history.length}
            />

            <div className="mt-5">
              {tab === "results" &&
                (result ? (
                  <ResultsDashboard result={result} />
                ) : (
                  <EmptyState analyzing={isAnalyzing} />
                ))}

              {tab === "maintenance" && result && showMaintenance && (
                <MaintenancePanel result={result} />
              )}

              {tab === "maintenance" && result && !showMaintenance && (
                <div className="rounded-2xl border border-safe/40 bg-safe/10 p-6 text-safe">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5" /> No maintenance actions required
                  </div>
                  <p className="mt-2 text-sm">
                    This structure is in {result.healthStatus.toLowerCase()} condition. Continue
                    routine inspections.
                  </p>
                </div>
              )}

              {tab === "history" && (
                <HistoryTable entries={history} onSelect={handleSelectHistory} />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Tabs({
  tab,
  setTab,
  hasResult,
  showMaintenance,
  historyCount,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  hasResult: boolean;
  showMaintenance: boolean;
  historyCount: number;
}) {
  const items: { key: Tab; label: string; icon: React.ReactNode; disabled?: boolean; badge?: string }[] = [
    { key: "results", label: "Results", icon: <Cpu className="size-4" />, disabled: !hasResult },
    {
      key: "maintenance",
      label: "Maintenance & Fixes",
      icon: <Wrench className="size-4" />,
      disabled: !hasResult || !showMaintenance,
    },
    {
      key: "history",
      label: "History",
      icon: <History className="size-4" />,
      badge: historyCount > 0 ? String(historyCount) : undefined,
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            disabled={it.disabled}
            onClick={() => setTab(it.key)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "bg-primary text-primary-foreground shadow"
                : "text-foreground/80 hover:bg-background/60"
            }`}
          >
            {it.icon}
            {it.label}
            {it.badge && (
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  active ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"
                }`}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ analyzing }: { analyzing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ScanLine className="size-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {analyzing ? "Analyzing structural image…" : "Awaiting upload"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Drop a photo of a beam, column, slab, or bridge deck on the left. Local AI inference will
        return a condition score, distress detection, and a maintenance plan.
      </p>
    </motion.div>
  );
}

function BackendStatus({ up }: { up: boolean | null }) {
  if (up === null)
    return (
      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        Checking backend…
      </span>
    );
  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        up
          ? "border-safe/40 bg-safe/10 text-safe"
          : "border-danger/40 bg-danger/10 text-danger"
      }`}
    >
      <span
        className={`size-2 rounded-full ${up ? "bg-safe" : "bg-danger"} animate-pulse`}
      />
      {up ? "Backend online" : "Backend offline (start FastAPI on :8000)"}
    </span>
  );
}

async function fileToDataUrl(file: File, size: number): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = size / Math.max(bmp.width, bmp.height);
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}
