"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Sparkles, RefreshCw, Check, X } from "lucide-react";
import {
  calculate,
  generateDrill,
  type DrillQuestion,
  type SubnetCalculation,
} from "@/lib/network/subnet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubnetTrainer() {
  const [ip, setIp] = useState("192.168.42.137");
  const [prefix, setPrefix] = useState(24);

  const calc = useMemo(() => calculate(ip, prefix), [ip, prefix]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <CardTitle>CIDR Calculator</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-[1fr_140px]">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  IP address
                </span>
                <input
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prefix /{prefix}
                </span>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={prefix}
                  onChange={(e) => setPrefix(Number(e.target.value))}
                  className="h-10 accent-[var(--color-primary)]"
                />
              </label>
            </div>

            {calc ? (
              <BitGrid calc={calc} />
            ) : (
              <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                Invalid IP address.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subnet Facts</CardTitle>
          </CardHeader>
          <CardContent>
            {calc ? <Facts calc={calc} /> : null}
          </CardContent>
        </Card>
      </div>

      <DrillMode />
    </div>
  );
}

function BitGrid({ calc }: { calc: SubnetCalculation }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bit view
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-primary" /> network bit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-accent" /> host bit
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((octet) => (
          <div key={octet} className="grid gap-1">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-muted-foreground">octet {octet + 1}</span>
              <span className="font-mono">{decToOct(calc.ipBits, octet)}</span>
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {Array.from({ length: 8 }, (_, i) => {
                const idx = octet * 8 + i;
                const bit = calc.ipBits[idx];
                const isNetwork = idx < calc.prefix;
                return (
                  <motion.div
                    key={idx}
                    initial={false}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.2, delay: idx * 0.01 }}
                    className={cn(
                      "grid h-7 place-items-center rounded-sm font-mono text-xs",
                      isNetwork
                        ? bit
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/30 text-primary"
                        : bit
                          ? "bg-accent text-accent-foreground"
                          : "bg-accent/20 text-accent",
                    )}
                  >
                    {bit}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(calc.prefix / 32) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>/0</span>
          <span>/16</span>
          <span>/24</span>
          <span>/32</span>
        </div>
      </div>
    </div>
  );
}

function decToOct(bits: number[], octet: number): string {
  let v = 0;
  for (let i = 0; i < 8; i++) v = (v << 1) | bits[octet * 8 + i];
  return String(v);
}

function Facts({ calc }: { calc: SubnetCalculation }) {
  const rows = [
    { k: "Network", v: `${calc.network} / ${calc.prefix}`, mono: true },
    { k: "Broadcast", v: calc.broadcast, mono: true },
    { k: "First usable", v: calc.firstUsable ?? "—", mono: true },
    { k: "Last usable", v: calc.lastUsable ?? "—", mono: true },
    { k: "Total addresses", v: calc.totalAddresses.toLocaleString() },
    { k: "Usable hosts", v: calc.usableHosts.toLocaleString() },
    { k: "Network bits", v: String(calc.networkBits) },
    { k: "Host bits", v: String(calc.hostBits) },
  ];
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div
          key={r.k}
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{r.k}</span>
          <span className={cn(r.mono && "font-mono")}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function DrillMode() {
  const [seed, setSeed] = useState(1);
  const [questions, setQuestions] = useState<DrillQuestion[]>(() => generateDrill(1));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setQuestions(generateDrill(seed));
    setIdx(0);
    setInput("");
    setFeedback(null);
    setScore(0);
    setShowHint(false);
  }, [seed]);

  const q = questions[idx];
  const finished = idx >= questions.length;

  const submit = () => {
    if (!q) return;
    const trimmed = input.trim();
    if (trimmed.toLowerCase() === q.answer.toLowerCase()) {
      setFeedback("correct");
      setScore((s) => s + 1);
    } else {
      setFeedback("wrong");
    }
  };

  const next = () => {
    setIdx((i) => i + 1);
    setInput("");
    setFeedback(null);
    setShowHint(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle>Drill mode</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              {Math.min(idx + (finished ? 0 : 1), questions.length)}/{questions.length}
            </Badge>
            <Badge variant="accent">Score {score}</Badge>
            <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
              <RefreshCw className="h-3.5 w-3.5" /> New set
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {finished ? (
          <div className="grid gap-3 rounded-md border border-border bg-card p-6 text-center">
            <p className="text-2xl font-semibold">
              {score} / {questions.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Want another set? Generate a new drill above.
            </p>
          </div>
        ) : q ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm">{q.prompt}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {q.data.ip}/{q.data.prefix}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Your answer"
                className="h-11 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
              />
              {feedback === null && (
                <Button onClick={submit} disabled={!input.trim()}>
                  Check
                </Button>
              )}
              {feedback !== null && (
                <Button onClick={next} variant="default">
                  Next →
                </Button>
              )}
            </div>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-2 rounded-md border p-3 text-sm",
                  feedback === "correct"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-danger/40 bg-danger/10 text-danger",
                )}
              >
                {feedback === "correct" ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  {feedback === "correct" ? "Correct!" : "Not quite."}{" "}
                  <span className="font-mono">expected: {q.answer}</span>
                </div>
              </motion.div>
            )}
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            {showHint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
