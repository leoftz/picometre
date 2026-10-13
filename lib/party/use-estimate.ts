"use client";

import { useEffect, useRef, useState } from "react";
import type { SimulationInput, SimulationResult } from "@/lib/bac/types";

/**
 * Estimates the gauge in a Web Worker; falls back to the main thread where workers are unavailable.
 * Only the latest request's answer is kept, so quick successive drinks never show a stale gauge.
 */
export function useEstimate(input: SimulationInput | null): SimulationResult | null {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    try {
      worker.current = new Worker(new URL("./bac.worker.ts", import.meta.url), { type: "module" });
      worker.current.onmessage = (event: MessageEvent<{ id: number; result: SimulationResult }>) => {
        if (event.data.id === latest.current) setResult(event.data.result);
      };
    } catch {
      worker.current = null;
    }
    return () => worker.current?.terminate();
  }, []);

  useEffect(() => {
    if (!input) return;
    const id = ++latest.current;
    if (worker.current) {
      worker.current.postMessage({ id, input });
      return;
    }
    let cancelled = false;
    void import("@/lib/bac/simulate").then(({ simulate }) => {
      if (!cancelled && id === latest.current) setResult(simulate(input));
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return result;
}
