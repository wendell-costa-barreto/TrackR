import { useState } from "react";
import { STATUS_OPTIONS, STATUS_CONFIG } from "../../types/types";
import type { Application, Status } from "../../types/types";
import { StatusBadge } from "./Atoms";

interface ExpandedRowProps {
  app: Application;
  onStatusChange: (id: string, status: Status) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeleteRequest: (id: string) => void;
}

export function ExpandedRow({
  app,
  onStatusChange,
  onNotesChange,
  onDeleteRequest,
}: ExpandedRowProps) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saved, setSaved] = useState(false);

  const handleSaveNotes = () => {
    onNotesChange(app.id, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="border-b border-zinc-800/40 bg-zinc-900/30 overflow-hidden">
      <div className="px-4 md:px-8 py-5 flex flex-col md:flex-row gap-5 md:gap-8 items-start">
        {/* Status */}
        <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[160px]">
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Status
          </span>
          <div className="flex flex-row flex-wrap md:flex-col gap-1.5">
            {STATUS_OPTIONS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = app.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(app.id, s)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                    active
                      ? `${cfg.color} ${cfg.bg} ring-1 ${cfg.ring}`
                      : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? cfg.dot : "bg-zinc-700"}`}
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block w-px self-stretch bg-zinc-800/60" />
        <div className="md:hidden w-full h-px bg-zinc-800/60" />

        {/* Notes */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="Add notes about this application…"
            rows={5}
            className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-700 transition-colors resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs transition-opacity duration-300 ${saved ? "text-emerald-500 opacity-100" : "opacity-0"}`}
            >
              ✓ Saved
            </span>
            <button
              onClick={handleSaveNotes}
              disabled={notes === app.notes}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Save notes
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px self-stretch bg-zinc-800/60" />
        <div className="md:hidden w-full h-px bg-zinc-800/60" />

        {/* Meta + delete */}
        <div className="flex flex-row flex-wrap md:flex-col gap-4 w-full md:w-auto md:min-w-[130px]">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              Applied
            </span>
            <span className="text-sm text-zinc-400">{app.applied}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              Salary
            </span>
            <span className="text-sm text-zinc-400">{app.salary}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              Status
            </span>
            <StatusBadge status={app.status} />
          </div>
          <div className="md:mt-auto md:pt-2">
            <button
              onClick={() => onDeleteRequest(app.id)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-red-400 transition-colors group"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
