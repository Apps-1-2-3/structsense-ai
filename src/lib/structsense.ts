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
