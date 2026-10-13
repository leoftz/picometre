// Runs the Monte Carlo BAC engine off the main thread so the screen never freezes (PLAN §1, lot 5).
import { simulate } from "@/lib/bac/simulate";
import type { SimulationInput } from "@/lib/bac/types";

self.onmessage = (event: MessageEvent<{ id: number; input: SimulationInput }>) => {
  const { id, input } = event.data;
  self.postMessage({ id, result: simulate(input) });
};
