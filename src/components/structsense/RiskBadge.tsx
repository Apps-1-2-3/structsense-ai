import { ShieldCheck, ShieldAlert, ShieldX, Shield, Info } from "lucide-react";
import { LoadRisk, riskColor, RISK_DESCRIPTIONS } from "@/lib/structsense";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICONS: Record<LoadRisk, React.ReactNode> = {
  Safe: <ShieldCheck className="size-3.5" />,
  Monitor: <Shield className="size-3.5" />,
  Restricted: <ShieldAlert className="size-3.5" />,
  Unsafe: <ShieldX className="size-3.5" />,
};

export function RiskBadge({ risk, size = "md" }: { risk: LoadRisk; size?: "sm" | "md" }) {
  const c = riskColor(risk);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex cursor-help items-center gap-1.5 rounded-full font-semibold ${pad}`}
            style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}
          >
            {ICONS[risk]}
            {risk}
            <Info className="size-3 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs border-border bg-card text-foreground">
          <div className="font-semibold" style={{ color: c }}>Load-bearing: {risk}</div>
          <div className="mt-1 text-xs text-muted-foreground">{RISK_DESCRIPTIONS[risk]}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
