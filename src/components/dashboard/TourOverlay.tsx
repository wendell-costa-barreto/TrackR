import { useEffect, useRef, useState } from "react";

export interface TourStep {
  target: string; // CSS selector of the element to highlight
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface Props {
  steps: TourStep[];
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // spotlight padding

export function TourOverlay({ steps, step, onNext, onPrev, onFinish }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const current = steps[step];

  useEffect(() => {
    const el = document.querySelector(current.target);
    if (!el) {
      setRect(null);
      return;
    }

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    update();
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step, current.target]);

  // Position tooltip after rect is known
  useEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const placement = current.placement ?? "bottom";
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0,
      left = 0;

    if (placement === "bottom") {
      top = rect.top + rect.height + PAD + 12;
      left = rect.left + rect.width / 2 - tt.width / 2;
    } else if (placement === "top") {
      top = rect.top - tt.height - PAD - 12;
      left = rect.left + rect.width / 2 - tt.width / 2;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - tt.height / 2;
      left = rect.left + rect.width + PAD + 12;
    } else {
      top = rect.top + rect.height / 2 - tt.height / 2;
      left = rect.left - tt.width - PAD - 12;
    }

    // Clamp within viewport
    left = Math.max(12, Math.min(left, vw - tt.width - 12));
    top = Math.max(12, Math.min(top, vh - tt.height - 12));

    setTooltipPos({ top, left });
  }, [rect, step, current.placement]);

  const spotTop = (rect?.top ?? 0) - PAD;
  const spotLeft = (rect?.left ?? 0) - PAD;
  const spotWidth = (rect?.width ?? 0) + PAD * 2;
  const spotHeight = (rect?.height ?? 0) + PAD * 2;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with SVG cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: "default" }}
        onClick={onFinish} // click outside → skip tour
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={spotLeft}
                y={spotTop}
                width={spotWidth}
                height={spotHeight}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border ring */}
      {rect && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            top: spotTop,
            left: spotLeft,
            width: spotWidth,
            height: spotHeight,
            boxShadow:
              "0 0 0 2px rgba(255,255,255,0.25), 0 0 0 4px rgba(255,255,255,0.08)",
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 288,
          transition:
            "top 0.25s cubic-bezier(0.4,0,0.2,1), left 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/70 p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">
                {step + 1} / {steps.length}
              </p>
              <h3 className="text-sm font-bold text-white leading-snug">
                {current.title}
              </h3>
            </div>
            <button
              onClick={onFinish}
              className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Skip tour"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {current.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step ? "w-5 bg-white" : "w-1.5 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onFinish}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={onNext}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={onFinish}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors"
                >
                  Done ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
