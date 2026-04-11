import type { Application } from "../../types/types";

const DOT: Record<string, string> = {
  offer: "bg-emerald-400",
  interview: "bg-blue-400",
  rejected: "bg-red-500",
  withdrawn: "bg-amber-400",
  applied: "bg-zinc-600",
  ghosted: "bg-zinc-600",
};

interface SidebarProps {
  applications: Application[];
}

export function Sidebar({ applications }: SidebarProps) {
  const total = applications.length || 1;

  const pipeline = [
    {
      label: "Applied",
      count: applications.filter((a) => a.status === "Applied").length,
      color: "bg-zinc-600",
    },
    {
      label: "Interview",
      count: applications.filter((a) => a.status === "Interview").length,
      color: "bg-blue-500",
    },
    {
      label: "Offer",
      count: applications.filter((a) => a.status === "Offer").length,
      color: "bg-emerald-500",
    },
    {
      label: "Rejected",
      count: applications.filter((a) => a.status === "Rejected").length,
      color: "bg-red-500",
    },
  ];

  const activity = applications
    .slice()
    .sort(
      (a, b) => new Date(b.applied).getTime() - new Date(a.applied).getTime(),
    )
    .slice(0, 8);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-800/50">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Recent Activity
        </h3>
        <p className="text-xs text-zinc-600 mt-0.5">Last 30 days</p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
        {activity.length === 0 ? (
          <p className="text-xs text-zinc-600">No activity yet.</p>
        ) : (
          activity.map((app, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT[app.status.toLowerCase()] ?? "bg-zinc-600"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 leading-snug">
                  <span className="text-zinc-500">Applied to </span>
                  <span className="font-semibold text-white">
                    {app.company}
                  </span>
                </p>
                <p className="text-xs text-zinc-500 truncate">{app.role}</p>
                <span className="text-[10px] text-zinc-700">{app.applied}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pipeline */}
      <div className="px-6 py-5 border-t border-zinc-800/50">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Pipeline
        </p>
        <div className="flex flex-col gap-2">
          {pipeline.map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 w-14">{label}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 w-4 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
