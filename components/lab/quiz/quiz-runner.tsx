"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, Download, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { CATEGORY_LABELS, type CategoryId, type QuizQuestion } from "@/lib/quiz/types";
import { QUESTIONS } from "@/lib/quiz/questions";
import { useProgress, type QuizAttempt } from "@/lib/quiz/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RunnerProps = { category: CategoryId | "mixed" };

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  let n = seed;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    n = (n * 9301 + 49297) % 233280;
    const j = Math.floor((n / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizRunner({ category }: RunnerProps) {
  const pool = useMemo(() => {
    const filtered =
      category === "mixed" ? QUESTIONS : QUESTIONS.filter((q) => q.category === category);
    return shuffle(filtered).slice(0, category === "mixed" ? 25 : 12);
  }, [category]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const startRef = useRef(Date.now());
  const recordAttempt = useProgress((s) => s.recordAttempt);

  const finished = idx >= pool.length;
  const correctCount = pool.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!finished) return;
    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      category,
      total: pool.length,
      correct: correctCount,
      startedAt: startRef.current,
      finishedAt: Date.now(),
      answers,
    };
    recordAttempt(attempt);
    if (correctCount / Math.max(1, pool.length) >= 0.7) {
      void confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (pool.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          No questions for this category yet.
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    return (
      <ResultsCard
        category={category}
        total={pool.length}
        correct={correctCount}
        onReplay={() => {
          setIdx(0);
          setAnswers({});
          setRevealed({});
          startRef.current = Date.now();
        }}
      />
    );
  }

  const q = pool[idx];
  const selected = answers[q.id];
  const isRevealed = revealed[q.id] ?? false;

  const select = (i: number) => {
    if (isRevealed) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };

  const submit = () => {
    if (selected === undefined) return;
    setRevealed((r) => ({ ...r, [q.id]: true }));
  };

  const next = () => {
    setIdx((i) => i + 1);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-sm">
        <Badge variant="primary">
          Question {idx + 1} / {pool.length}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {q.difficulty}
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-5 p-6">
          <p className="text-base font-medium">{q.prompt}</p>
          <div className="grid gap-2">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = q.answer === i;
              const showCorrect = isRevealed && isCorrect;
              const showWrong = isRevealed && isSelected && !isCorrect;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(i)}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left text-sm transition-colors",
                    !isRevealed && isSelected && "border-primary ring-2 ring-primary/40",
                    showCorrect && "border-accent bg-accent/10 text-accent",
                    showWrong && "border-danger bg-danger/10 text-danger",
                    isRevealed && !isSelected && !isCorrect && "opacity-60",
                  )}
                >
                  <span>{opt}</span>
                  {showCorrect && <Check className="h-4 w-4" />}
                  {showWrong && <X className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-md border border-border bg-muted/40 p-3 text-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Why
                </p>
                <p className="mt-1">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-end gap-2">
            {!isRevealed ? (
              <Button onClick={submit} disabled={selected === undefined}>
                Submit
              </Button>
            ) : (
              <Button onClick={next}>
                {idx === pool.length - 1 ? "Finish" : "Next"} →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsCard({
  category,
  total,
  correct,
  onReplay,
}: {
  category: CategoryId | "mixed";
  total: number;
  correct: number;
  onReplay: () => void;
}) {
  const certRef = useRef<HTMLDivElement>(null);
  const pct = Math.round((correct / Math.max(1, total)) * 100);
  const passed = pct >= 70;
  const label =
    category === "mixed" ? "Mixed challenge" : CATEGORY_LABELS[category];

  const downloadCertificate = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `netlab-certificate-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold">{pct}%</span>
            <span className="pb-1 text-muted-foreground">
              ({correct}/{total} correct)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {passed
              ? `Nice work — you cleared the ${label} challenge.`
              : "Below 70%. Re-run the lab modules and try again — you'll get there."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onReplay} variant="outline">
              <RotateCcw className="h-4 w-4" /> Replay
            </Button>
            {passed && (
              <Button onClick={downloadCertificate}>
                <Download className="h-4 w-4" /> Download certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {passed && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div
            ref={certRef}
            className="relative w-full bg-gradient-to-br from-card via-card to-muted px-12 py-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,hsl(245_90%_70%/0.2),transparent_60%)]"
            />
            <div className="relative grid gap-6">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Trophy className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold tracking-tight">NetLab</span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Certificate of Achievement
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {label} — {pct}%
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Awarded for successfully completing the NetLab challenge for the {label}{" "}
                module of BTO3102 Computer Networks (Spring 2026).
              </p>
              <div className="flex flex-wrap items-end justify-between gap-3 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Awarded to
                  </p>
                  <p className="font-medium">NetLab Learner</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Course
                  </p>
                  <p className="font-medium">BTO3102 · YTÜ BÖTE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
