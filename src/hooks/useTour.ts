import { useState, useEffect, useRef } from "react";

const TOUR_KEY = "trackr_tour_done";

export function useTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-invoke and SSR
    if (hasRun.current) return;
    hasRun.current = true;

    let isMounted = true;

    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        const t = setTimeout(() => {
          if (isMounted) setActive(true);
        }, 600);
        return () => {
          isMounted = false;
          clearTimeout(t);
        };
      }
    } catch {
      // localStorage unavailable (SSR, private browsing, etc.)
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    setActive(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // ignore
    }
  };

  const restart = () => {
    setStep(0);
    setActive(true);
  };

  return { active, step, next, prev, finish, restart };
}