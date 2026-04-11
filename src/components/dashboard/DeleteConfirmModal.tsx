import { useState } from "react";

interface DeleteConfirmModalProps {
  companyName: string;
  onConfirm: (suppressFuture: boolean) => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  companyName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [suppress, setSuppress] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-6 md:p-8 w-full sm:max-w-sm shadow-2xl shadow-black/80 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/60 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-400"
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
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Delete application?
            </h2>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
              This will permanently remove your application to{" "}
              <span className="text-zinc-300 font-semibold">{companyName}</span>
              . This action cannot be undone.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={suppress}
              onChange={(e) => setSuppress(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${suppress ? "bg-white border-white" : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-500"}`}
              onClick={() => setSuppress(!suppress)}
            >
              {suppress && (
                <svg
                  className="w-2.5 h-2.5 text-zinc-950"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors leading-snug">
              Don't show this again
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
              Future deletions will happen immediately.
            </p>
          </div>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-zinc-800 text-zinc-400 text-sm font-semibold py-2.5 rounded-lg hover:text-white hover:border-zinc-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(suppress)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
