export const API_BASE =
  (import.meta as unknown as { env?: { VITE_STRUCTSENSE_API?: string } }).env
    ?.VITE_STRUCTSENSE_API ?? "http://localhost:8000";

export type Severity = "Low" | "Medium" | "High";
export type HealthStatus = "Critical" | "Poor" | "Moderate" | "Good" | "Excellent";
export type Priority = "Immediate" | "Short-term" | "Routine" | "None";
export type LoadRisk = "Safe" | "Monitor" | "Restricted" | "Unsafe";

export type BoundingBox = [number, number, number, number]; // [x, y, w, h] normalized 0-1

export interface DistressType {
  name: string;
  severity: Severity;
  confidence: number;
  location: string;
  boundingBoxes?: BoundingBox[];
}


export interface MaintenancePlanItem {
  distressName: string;
  immediateAction: string;
  repairMethod: string;
  urgencyTimeline: string;
  materialsNeeded: string[];
  requiresEngineer: boolean;
}

export interface HealthSummary {
  conditionSentence: string;
  loadBearingRisk: LoadRisk;
  inspectionFrequency: string;
}

export interface NdtChecklistItem {
  method: string;
  description: string;
}

export interface AnalysisResult {
  structureType: string;
  overallHealthScore: number;
  healthStatus: HealthStatus;
  distressTypes: DistressType[];
  maintenancePriority: Priority;
  recommendations: string[];
  ndeMethodSuggested: string;
  safetyAlert: boolean;
  maintenancePlan: MaintenancePlanItem[];
  healthSummary: HealthSummary;
  ndtChecklist: NdtChecklistItem[];
}

export interface HistoryEntry {
  id: string;
  date: string;
  thumbnail: string;
  result: AnalysisResult;
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Backend error (${res.status})`);
  return (await res.json()) as AnalysisResult;
}

export async function pingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

const HISTORY_KEY = "structsense.history.v1";
const CHECKLIST_KEY = "structsense.checklist.v1";

export function loadHistory(): HistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: HistoryEntry) {
  const next = [entry, ...loadHistory()].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function loadChecklistState(): Record<string, boolean> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveChecklistState(state: Record<string, boolean>) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#22C55E";
  if (score >= 70) return "#00C9A7";
  if (score >= 50) return "#F59E0B";
  if (score >= 30) return "#F97316";
  return "#EF4444";
}

export function severityColor(s: Severity): string {
  return s === "High" ? "#EF4444" : s === "Medium" ? "#F59E0B" : "#FACC15";
}

export function riskColor(r: LoadRisk): string {
  return r === "Safe" ? "#22C55E" : r === "Monitor" ? "#FACC15" : r === "Restricted" ? "#F59E0B" : "#EF4444";
}

export const RISK_DESCRIPTIONS: Record<LoadRisk, string> = {
  Safe: "Structure can support its full design load. Routine inspection only.",
  Monitor: "Load capacity intact but early distress detected. Increase inspection frequency.",
  Restricted: "Reduce live loading. Repairs required before resuming full service.",
  Unsafe: "Do not load. Evacuate and consult a licensed structural engineer immediately.",
};

export async function generatePdfReport(result: AnalysisResult, previewUrl?: string | null) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("StructSense — Structural Health Report", 40, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(new Date().toLocaleString(), 40, y);
  y += 24;

  if (previewUrl) {
    try {
      const dataUrl = previewUrl.startsWith("data:") ? previewUrl : await urlToDataUrl(previewUrl);
      doc.addImage(dataUrl, "JPEG", 40, y, 180, 120, undefined, "FAST");
    } catch { /* ignore */ }
  }

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Structure", 240, y + 14);
  doc.setFont("helvetica", "normal");
  doc.text(result.structureType, 240, y + 30);

  doc.setFont("helvetica", "bold");
  doc.text("Health Score", 240, y + 54);
  doc.setFontSize(22);
  doc.setTextColor(scoreColor(result.overallHealthScore));
  doc.text(`${result.overallHealthScore} / 100`, 240, y + 78);
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(`Status: ${result.healthStatus}`, 240, y + 96);
  doc.text(`Load-bearing risk: ${result.healthSummary.loadBearingRisk}`, 240, y + 112);

  y += 150;

  y = section(doc, y, "Detected Distress");
  result.distressTypes.forEach((d) => {
    y = ensure(doc, y, 28);
    doc.setFont("helvetica", "bold");
    doc.text(`• ${d.name}  (${d.severity}, ${d.confidence}%)`, 48, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);
    doc.text(`  ${d.location}`, 48, y);
    doc.setTextColor(20);
    y += 16;
  });

  y = section(doc, y + 6, "Health Summary");
  y = wrapText(doc, result.healthSummary.conditionSentence, 48, y, W - 88);
  y += 6;
  doc.text(`Inspection cadence: ${result.healthSummary.inspectionFrequency}`, 48, y);
  y += 16;

  y = section(doc, y + 6, "Maintenance Plan");
  result.maintenancePlan.forEach((m) => {
    y = ensure(doc, y, 70);
    doc.setFont("helvetica", "bold");
    doc.text(m.distressName, 48, y); y += 14;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, `Immediate: ${m.immediateAction}`, 48, y, W - 88);
    y = wrapText(doc, `Repair: ${m.repairMethod}`, 48, y, W - 88);
    y = wrapText(doc, `Timeline: ${m.urgencyTimeline}`, 48, y, W - 88);
    y = wrapText(doc, `Materials: ${m.materialsNeeded.join(", ")}`, 48, y, W - 88);
    y = wrapText(doc, `Requires engineer: ${m.requiresEngineer ? "Yes" : "No"}`, 48, y, W - 88);
    y += 8;
  });

  y = section(doc, y + 6, "NDT Follow-up Checklist");
  result.ndtChecklist.forEach((n) => {
    y = ensure(doc, y, 28);
    doc.setFont("helvetica", "bold"); doc.text(`☐  ${n.method}`, 48, y); y += 14;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, n.description, 64, y, W - 104);
    y += 6;
  });

  doc.save(`structsense-${result.structureType.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

type Doc = import("jspdf").jsPDF;
function section(doc: Doc, y: number, title: string): number {
  y = ensure(doc, y, 40);
  doc.setDrawColor(220);
  doc.line(40, y, doc.internal.pageSize.getWidth() - 40, y);
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text(title, 40, y);
  y += 14;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  return y;
}
function wrapText(doc: Doc, text: string, x: number, y: number, maxW: number): number {
  const lines = doc.splitTextToSize(text, maxW) as string[];
  lines.forEach((ln) => {
    y = ensure(doc, y, 14);
    doc.text(ln, x, y);
    y += 14;
  });
  return y;
}
function ensure(doc: Doc, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    return 48;
  }
  return y;
}
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

