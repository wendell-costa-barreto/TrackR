import { useState, useEffect } from "react";

const TOUR_KEY = "trackr_tour_done";
let tourInitialized = false;

export function useTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (tourInitialized) return;
    tourInitialized = true;

    const tourDone = localStorage.getItem(TOUR_KEY);
    if (!tourDone) {
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
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