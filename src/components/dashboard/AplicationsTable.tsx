import { useState } from "react";
import type { Application, Status } from "../../types/types";
import { StatusBadge, LogoChip } from "./Atoms";
import { ExpandedRow } from "./ExpandedRow";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface ApplicationsTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: Status) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  total: number;
  skipConfirm: boolean;
  onSkipConfirmChange: (val: boolean) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function ApplicationsTable({
  applications,
  onStatusChange,
  onNotesChange,
  onDelete,
  skipConfirm,
  onSkipConfirmChange,
  selectedIds,
  onToggleSelect,
}: ApplicationsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleRowClick = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleDeleteRequest = (id: string) => {
    if (skipConfirm) {
      onDelete(id);
      if (expandedId === id) setExpandedId(null);
    } else {
      setDeleteTargetId(id);
    }
  };

  const handleDeleteConfirm = (suppress: boolean) => {
    if (suppress) onSkipConfirmChange(true);
    if (deleteTargetId !== null) {
      onDelete(deleteTargetId);
      if (expandedId === deleteTargetId) setExpandedId(null);
    }
    setDeleteTargetId(null);
  };

  const deleteTarget =
    applications.find((a) => a.id === deleteTargetId) ?? null;

  return (
    <>
      {/* Desktop column headers */}
      <div className="hidden md:grid grid-cols-[2rem_2fr_1fr_1fr_1fr_1.5rem] gap-4 px-6 py-3 border-b border-zinc-800/40">
        {/* Empty header above checkboxes */}
        <span />
        {["Company / Role", "Status", "Salary", "Applied"].map((h) => (
          <span
            key={h}
            className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider"
          >
            {h}
          </span>
        ))}
        <span />
      </div>

      <div className="flex-1 overflow-y-auto">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-600">
            <span className="text-sm">No applications found</span>
          </div>
        ) : (
          applications.map((app, i) => {
            const isExpanded = expandedId === app.id;
            const isSelected = selectedIds.has(app.id);

            return (
              <div key={app.id} className="animate-fade-in">
                {/* ── Mobile card ── */}
                <div
                  className={`md:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800/30 transition-colors ${
                    isSelected
                      ? "bg-zinc-900/70"
                      : isExpanded
                        ? "bg-zinc-900/60"
                        : ""
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(app.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-white cursor-pointer flex-shrink-0"
                  />

                  {/* Row content — tapping this expands */}
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:opacity-70"
                    onClick={() => handleRowClick(app.id)}
                  >
                    <LogoChip letter={app.company?.[0] ?? "?"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {app.company}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {app.role}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={app.status} />
                      <span className="text-[10px] text-zinc-600">
                        {app.applied}
                      </span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-zinc-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* ── Desktop row ── */}
                <div
                  className={`hidden md:grid grid-cols-[2rem_2fr_1fr_1fr_1fr_1.5rem] gap-4 items-center px-6 py-4 border-b border-zinc-800/30 group transition-all duration-150 ${
                    isSelected
                      ? "bg-zinc-900/70 border-zinc-700/40"
                      : isExpanded
                        ? "bg-zinc-900/60 border-zinc-700/40"
                        : i % 2 === 0
                          ? "hover:bg-zinc-900/40"
                          : "bg-zinc-900/10 hover:bg-zinc-900/40"
                  }`}
                >
                  {/* Checkbox cell — stopPropagation so it doesn't expand the row */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(app.id)}
                      className="w-4 h-4 rounded accent-white cursor-pointer"
                    />
                  </div>

                  {/* Company / Role — clicking expands */}
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => handleRowClick(app.id)}
                  >
                    <LogoChip letter={app.company?.[0] ?? "?"} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {app.company}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {app.role}
                      </p>
                    </div>
                  </div>

                  {/* Status — stopPropagation so badge dropdown doesn't expand row */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={app.status} />
                  </div>

                  {/* Salary / Applied — clicking expands */}
                  <span
                    className="text-sm text-zinc-400 font-medium cursor-pointer"
                    onClick={() => handleRowClick(app.id)}
                  >
                    {app.salary}
                  </span>
                  <span
                    className="text-sm text-zinc-600 cursor-pointer"
                    onClick={() => handleRowClick(app.id)}
                  >
                    {app.applied}
                  </span>

                  {/* Chevron */}
                  <svg
                    onClick={() => handleRowClick(app.id)}
                    className={`w-3.5 h-3.5 text-zinc-600 cursor-pointer transition-all duration-200 ${
                      isExpanded
                        ? "rotate-180 text-zinc-400"
                        : "group-hover:text-zinc-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {isExpanded && (
                  <ExpandedRow
                    app={app}
                    onStatusChange={onStatusChange}
                    onNotesChange={onNotesChange}
                    onDeleteRequest={handleDeleteRequest}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {deleteTargetId !== null && deleteTarget && (
        <DeleteConfirmModal
          companyName={deleteTarget.company}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </>
  );
}
