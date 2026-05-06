"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CategoryId } from "./types";

export interface QuizAttempt {
  id: string;
  category: CategoryId | "mixed";
  total: number;
  correct: number;
  startedAt: number;
  finishedAt: number;
  answers: Record<string, number>;
}

export interface ProgressState {
  attempts: QuizAttempt[];
  recordAttempt: (a: QuizAttempt) => void;
  reset: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      attempts: [],
      recordAttempt: (a) =>
        set((s) => ({ attempts: [a, ...s.attempts].slice(0, 50) })),
      reset: () => set({ attempts: [] }),
    }),
    { name: "netlab.progress" },
  ),
);

export function bestPerCategory(attempts: QuizAttempt[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of attempts) {
    const pct = Math.round((a.correct / Math.max(1, a.total)) * 100);
    if (out[a.category] === undefined || pct > out[a.category]) {
      out[a.category] = pct;
    }
  }
  return out;
}
