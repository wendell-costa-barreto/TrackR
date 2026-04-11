import { useState } from "react";
import { STATUS_OPTIONS } from "../../types/types";
import type { Application, Status } from "../../types/types";

interface AddApplicationModalProps {
  onAdd: (app: Omit<Application, "id">) => void;
  onClose: () => void;
}

export function AddApplicationModal({
  onAdd,
  onClose,
}: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<Status>("Applied");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    onAdd({
      company: company.trim(),
      role: role.trim(),
      salary: salary.trim() || "—",
      status,
      applied: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      logo: company.trim()[0].toUpperCase(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-6 md:p-8 w-full sm:max-w-md shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold tracking-tight mb-1">
          New Application
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Add a job you've applied to
        </p>

        <div className="flex flex-col gap-4">
          {[
            {
              label: "Company",
              value: company,
              set: setCompany,
              placeholder: "e.g. Stripe",
            },
            {
              label: "Role",
              value: role,
              set: setRole,
              placeholder: "e.g. Frontend Engineer",
            },
            {
              label: "Salary",
              value: salary,
              set: setSalary,
              placeholder: "e.g. $140k",
            },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                {label}
              </label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Notes{" "}
              <span className="text-zinc-700 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details worth remembering…"
              rows={3}
              className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-800 text-zinc-400 text-sm font-semibold py-3 rounded-lg hover:text-white hover:border-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!company.trim() || !role.trim()}
            className="flex-1 bg-white text-zinc-950 text-sm font-bold py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add Application
          </button>
        </div>
      </div>
    </div>
  );
}
