import { STATUS_CONFIG } from "../../types/types";
import type { Status } from "../../types/types";

export function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${cfg.color} ${cfg.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

export function LogoChip({ letter }: { letter: string }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0 select-none">
      {letter}
    </div>
  );
}

export function StatCard({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 px-5 md:px-8 py-4 md:py-6 border-r border-zinc-800/70 last:border-r-0 flex-1 min-w-[110px] ${accent ? "bg-zinc-900/40" : ""}`}
    >
      <span className="text-2xl md:text-4xl font-extrabold tracking-tight leading-none text-white">
        {value}
      </span>
      <span className="text-[10px] md:text-xs text-zinc-500 font-medium tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}
