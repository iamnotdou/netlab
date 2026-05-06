"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw, Server, Laptop, ArrowRight } from "lucide-react";
import {
  HANDSHAKE_STEPS,
  CLIENT_STATES,
  SERVER_STATES,
  STATE_DESCRIPTIONS,
  type TcpState,
  type TcpStep,
} from "@/lib/network/tcp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TcpHandshake() {
  const [stepIndex, setStepIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const completed = stepIndex >= HANDSHAKE_STEPS.length - 1 && !running;

  const cancelRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const next = stepIndex + 1;
    if (next >= HANDSHAKE_STEPS.length) {
      setRunning(false);
      return;
    }
    const step = HANDSHAKE_STEPS[next];
    setStepIndex(next);
    const t = window.setTimeout(() => {
      if (cancelRef.current) return;
      if (next === HANDSHAKE_STEPS.length - 1) {
        setRunning(false);
      }
    }, step.flightTime * 1000 + 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIndex === -1 ? -1 : stepIndex]);

  const start = () => {
    cancelRef.current = false;
    setStepIndex(-1);
    setRunning(true);
  };

  const reset = () => {
    cancelRef.current = true;
    setRunning(false);
    setStepIndex(-1);
  };

  const current: TcpStep | null = stepIndex >= 0 ? HANDSHAKE_STEPS[stepIndex] : null;
  const clientState: TcpState = current ? current.clientState : "CLOSED";
  const serverState: TcpState = current ? current.serverState : "LISTEN";

  const visibleHistory = useMemo(
    () => HANDSHAKE_STEPS.slice(0, Math.max(0, stepIndex + 1)),
    [stepIndex],
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm text-muted-foreground">
            Three-way handshake: Client &amp; Server agree on initial sequence numbers before any
            data is sent.
          </div>
          <div className="flex gap-2">
            {running ? (
              <Button variant="secondary" disabled>
                <Play className="h-4 w-4" /> Running…
              </Button>
            ) : (
              <Button onClick={start}>
                <Play className="h-4 w-4" /> {completed ? "Replay" : "Start handshake"}
              </Button>
            )}
            <Button variant="outline" onClick={reset} disabled={stepIndex === -1}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Sequence Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <SequenceDiagram step={current} stepIndex={stepIndex} />
            <div className="mt-6 grid gap-2 text-sm">
              <p className="text-muted-foreground">
                {current
                  ? current.narration
                  : "Press Start to walk through SYN → SYN+ACK → ACK and watch both state machines update."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <StateMachineCard
            title="Client"
            icon={Laptop}
            states={CLIENT_STATES}
            current={clientState}
          />
          <StateMachineCard
            title="Server"
            icon={Server}
            states={SERVER_STATES}
            current={serverState}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segments seen</CardTitle>
        </CardHeader>
        <CardContent>
          {visibleHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No segments yet.</p>
          ) : (
            <ol className="grid gap-2">
              {visibleHistory.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="primary">#{i + 1}</Badge>
                    <span className="font-mono text-xs">{s.bullet}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.segment.description}</span>
                </motion.li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StateMachineCard({
  title,
  icon: Icon,
  states,
  current,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  states: TcpState[];
  current: TcpState;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {states.map((s, i) => (
          <div key={s} className="flex items-start gap-2">
            <div className="grid grid-cols-[8px_1fr] items-start gap-2">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    current === s ? "bg-primary" : "bg-border",
                  )}
                />
                {i < states.length - 1 && (
                  <div className="absolute top-2 h-10 w-px bg-border" />
                )}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-sm transition-colors",
                      current === s ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s}
                  </span>
                  {current === s && <Badge variant="primary">active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{STATE_DESCRIPTIONS[s]}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SequenceDiagram({
  step,
  stepIndex,
}: {
  step: TcpStep | null;
  stepIndex: number;
}) {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/30 to-transparent">
      {/* Hosts */}
      <div className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium">
        <Laptop className="h-4 w-4 text-primary" />
        Client
      </div>
      <div className="absolute right-6 top-6 flex items-center gap-2 text-sm font-medium">
        Server
        <Server className="h-4 w-4 text-primary" />
      </div>

      {/* Vertical lifelines */}
      <div className="absolute left-[12%] top-16 bottom-6 w-px bg-border" />
      <div className="absolute right-[12%] top-16 bottom-6 w-px bg-border" />

      {/* Segment lanes — show all 3 lanes, animate the active one */}
      {HANDSHAKE_STEPS.map((s, i) => {
        const top = 28 + (i + 1) * 18; // % from top
        const isActive = stepIndex === i;
        const seen = stepIndex >= i;
        const fromLeft = s.direction === "client-to-server";
        return (
          <div
            key={s.id}
            className="absolute"
            style={{
              top: `${top}%`,
              left: "12%",
              right: "12%",
            }}
          >
            <div className="relative h-0">
              {/* Static arrow line */}
              <div
                className={cn(
                  "absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 transition-colors",
                  seen ? "bg-primary/60" : "bg-border",
                )}
              />
              {/* Arrowhead */}
              <ArrowRight
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                  fromLeft ? "right-[-4px]" : "left-[-4px] rotate-180",
                  seen ? "text-primary" : "text-border",
                )}
              />

              {/* Animated packet */}
              {isActive && (
                <motion.div
                  initial={{ left: fromLeft ? "0%" : "100%", opacity: 0 }}
                  animate={{ left: fromLeft ? "100%" : "0%", opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    left: { duration: s.flightTime, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="rounded-md bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground shadow-[var(--shadow-glow)]">
                    {s.segment.flags}
                  </div>
                </motion.div>
              )}

              {/* Label above the line */}
              <div
                className={cn(
                  "absolute top-[-22px] font-mono text-xs transition-colors",
                  fromLeft ? "left-1/2 -translate-x-1/2" : "left-1/2 -translate-x-1/2",
                  seen ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.segment.flags}
                {s.segment.ack !== null && (
                  <span className="ml-1 text-muted-foreground">
                    seq={s.segment.seq}, ack={s.segment.ack}
                  </span>
                )}
                {s.segment.ack === null && (
                  <span className="ml-1 text-muted-foreground">seq={s.segment.seq}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {step && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-1/2 bottom-3 w-[80%] -translate-x-1/2 rounded-md border border-border bg-card/80 px-3 py-2 text-center text-xs backdrop-blur"
          >
            <span className="text-muted-foreground">{step.segment.description}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
