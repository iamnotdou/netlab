"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw, Search, Globe, Server, Database, User } from "lucide-react";
import {
  buildScenario,
  HOP_COLORS,
  type DnsHop,
  type DnsServerKind,
} from "@/lib/network/dns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<DnsServerKind, React.ComponentType<{ className?: string }>> = {
  client: User,
  resolver: Search,
  root: Globe,
  tld: Database,
  authoritative: Server,
};

// Node positions on a 100x100 grid
const POSITIONS: Record<DnsServerKind, { x: number; y: number }> = {
  client: { x: 8, y: 86 },
  resolver: { x: 30, y: 50 },
  root: { x: 55, y: 14 },
  tld: { x: 78, y: 40 },
  authoritative: { x: 88, y: 78 },
};

export function DnsDetective() {
  const [domain, setDomain] = useState("www.yildiz.edu.tr");
  const [hopIndex, setHopIndex] = useState(-1);
  const [running, setRunning] = useState(false);

  const scenario = useMemo(() => buildScenario(domain), [domain]);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const next = hopIndex + 1;
    if (next >= scenario.hops.length) {
      setRunning(false);
      return;
    }
    setHopIndex(next);
    const t = window.setTimeout(() => {
      if (cancelRef.current) return;
      if (next === scenario.hops.length - 1) setRunning(false);
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, hopIndex === -1 ? -1 : hopIndex, scenario.hops.length]);

  const start = () => {
    cancelRef.current = false;
    setHopIndex(-1);
    setRunning(true);
  };

  const reset = () => {
    cancelRef.current = true;
    setRunning(false);
    setHopIndex(-1);
  };

  const currentHop: DnsHop | null = hopIndex >= 0 ? scenario.hops[hopIndex] : null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              spellCheck={false}
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
              placeholder="www.example.com"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={start} disabled={running}>
              <Play className="h-4 w-4" /> {hopIndex === scenario.hops.length - 1 ? "Replay" : "Resolve"}
            </Button>
            <Button variant="outline" onClick={reset} disabled={hopIndex === -1}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Recursive Resolution Map</CardTitle>
          </CardHeader>
          <CardContent>
            <Topology scenario={scenario} currentHop={currentHop} hopIndex={hopIndex} />
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              <LegendDot color={HOP_COLORS.query} label="Query" />
              <LegendDot color={HOP_COLORS.referral} label="Referral (NS)" />
              <LegendDot color={HOP_COLORS.answer} label="Answer (A)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-step</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {scenario.hops.map((h, i) => {
              const seen = hopIndex >= i;
              const isCurrent = hopIndex === i;
              return (
                <motion.div
                  key={h.id}
                  initial={false}
                  animate={{ opacity: seen ? 1 : 0.5 }}
                  className={cn(
                    "rounded-md border border-border bg-card p-3 text-sm transition-colors",
                    isCurrent && "ring-1 ring-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: HOP_COLORS[h.type] }}
                    />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h.type}
                    </span>
                    <Badge variant="outline">{h.recordType}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs">{h.payload}</p>
                  {seen && (
                    <p className="mt-1 text-xs text-muted-foreground">{h.narration}</p>
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {hopIndex === scenario.hops.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved</p>
                  <p className="font-mono text-sm">
                    {scenario.domain}
                    <span className="mx-2 text-muted-foreground">→</span>
                    {scenario.finalIp}
                  </p>
                </div>
                <Badge variant="primary">A record cached</Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Topology({
  scenario,
  currentHop,
  hopIndex,
}: {
  scenario: ReturnType<typeof buildScenario>;
  currentHop: DnsHop | null;
  hopIndex: number;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/30 to-transparent">
      <div className="aspect-[16/10] w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {/* Static edges between nodes that are part of any hop */}
          {scenario.hops.map((h, i) => {
            const from = POSITIONS[h.fromKind];
            const to = POSITIONS[h.toKind];
            const seen = hopIndex >= i;
            return (
              <line
                key={`bg-${h.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={seen ? HOP_COLORS[h.type] : "var(--color-border)"}
                strokeOpacity={seen ? 0.45 : 0.6}
                strokeWidth={0.4}
                strokeDasharray="1.4 1.4"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Active hop animated dash */}
          {currentHop && (
            <line
              x1={POSITIONS[currentHop.fromKind].x}
              y1={POSITIONS[currentHop.fromKind].y}
              x2={POSITIONS[currentHop.toKind].x}
              y2={POSITIONS[currentHop.toKind].y}
              stroke={HOP_COLORS[currentHop.type]}
              strokeWidth={0.7}
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              style={{ animation: "dash-flow 0.8s linear infinite" }}
            />
          )}
        </svg>

        {/* Animated packet */}
        <AnimatePresence>
          {currentHop && (
            <motion.div
              key={currentHop.id}
              initial={{
                left: `${POSITIONS[currentHop.fromKind].x}%`,
                top: `${POSITIONS[currentHop.fromKind].y}%`,
                opacity: 0,
              }}
              animate={{
                left: `${POSITIONS[currentHop.toKind].x}%`,
                top: `${POSITIONS[currentHop.toKind].y}%`,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                left: { duration: 1.0, ease: "easeInOut" },
                top: { duration: 1.0, ease: "easeInOut" },
                opacity: { duration: 0.2 },
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="rounded-full px-2.5 py-1 font-mono text-[10px] text-white shadow-[var(--shadow-glow)]"
                style={{ background: HOP_COLORS[currentHop.type] }}
              >
                {currentHop.recordType}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nodes */}
        {scenario.nodes.map((n) => {
          const pos = POSITIONS[n.kind];
          const Icon = KIND_ICONS[n.kind];
          const involved =
            currentHop?.fromKind === n.kind || currentHop?.toKind === n.kind;
          return (
            <div
              key={n.kind}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <motion.div
                animate={{ scale: involved ? 1.06 : 1 }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-center shadow-sm",
                  involved && "ring-2 ring-primary",
                )}
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium leading-none">{n.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{n.sub}</span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
