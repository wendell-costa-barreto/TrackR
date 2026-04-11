export type Status =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Ghosted"
  | "Withdrawn";

export interface Application {
  id: string;       // UUID from Supabase
  company: string;
  role: string;
  status: Status;
  salary: string;
  applied: string;  // formatted display string e.g. "Mar 28"
  logo: string;
  notes: string;
}

export const STATUS_OPTIONS: Status[] = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

export const STATUS_CONFIG: Record<
  Status,
  { color: string; bg: string; dot: string; ring: string }
> = {
  Applied:   { color: "text-zinc-300",    bg: "bg-zinc-800",        dot: "bg-zinc-400",    ring: "ring-zinc-700"    },
  Interview: { color: "text-blue-300",    bg: "bg-blue-950/60",     dot: "bg-blue-400",    ring: "ring-blue-800"    },
  Offer:     { color: "text-emerald-300", bg: "bg-emerald-950/60",  dot: "bg-emerald-400", ring: "ring-emerald-800" },
  Rejected:  { color: "text-red-400",     bg: "bg-red-950/40",      dot: "bg-red-500",     ring: "ring-red-900"     },
  Ghosted:   { color: "text-zinc-500",    bg: "bg-zinc-900",        dot: "bg-zinc-600",    ring: "ring-zinc-800"    },
  Withdrawn: { color: "text-amber-400",   bg: "bg-amber-950/40",    dot: "bg-amber-500",   ring: "ring-amber-900"   },
};