"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Send, ChevronRight, Info } from "lucide-react";
import {
  buildLayers,
  DEFAULT_INPUT,
  LAYER_ORDER,
  PHASE_DESCRIPTIONS,
  type LayerSpec,
  type LayerKey,
  type SimulationInput,
} from "@/lib/network/encapsulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "encap-application"
  | "encap-transport"
  | "encap-network"
  | "encap-link"
  | "encap-physical"
  | "traveling"
  | "decap-physical"
  | "decap-link"
  | "decap-network"
  | "decap-transport"
  | "decap-application"
  | "delivered";

const TIMELINE: Phase[] = [
  "encap-application",
  "encap-transport",
  "encap-network",
  "encap-link",
  "encap-physical",
  "traveling",
  "decap-physical",
  "decap-link",
  "decap-network",
  "decap-transport",
  "decap-application",
  "delivered",
];

const SPEEDS = [
  { label: "0.5×", multiplier: 2 },
  { label: "1×", multiplier: 1 },
  { label: "2×", multiplier: 0.5 },
] as const;

const BASE_STEP_MS = 1100;

function srcStack(phase: Phase): LayerKey[] {
  const idx = TIMELINE.indexOf(phase);
  if (phase === "idle") return [];
  if (idx === -1) return [];
  if (phase.startsWith("encap-")) {
    const layerKey = phase.replace("encap-", "") as LayerKey;
    const upTo = LAYER_ORDER.indexOf(layerKey);
    return LAYER_ORDER.slice(0, upTo + 1);
  }
  return [...LAYER_ORDER];
}

function dstStack(phase: Phase): LayerKey[] {
  if (phase === "idle" || phase.startsWith("encap-") || phase === "traveling") return [];
  if (phase === "delivered") return [...LAYER_ORDER];
  if (phase.startsWith("decap-")) {
    const layerKey = phase.replace("decap-", "") as LayerKey;
    const upTo = LAYER_ORDER.indexOf(layerKey);
    return LAYER_ORDER.slice(upTo);
  }
  return [];
}

function activeLayerKey(phase: Phase): LayerKey | null {
  if (phase.startsWith("encap-") || phase.startsWith("decap-")) {
    return phase.replace(/^(encap|decap)-/, "") as LayerKey;
  }
  return null;
}

function descriptionKey(phase: Phase): string {
  return phase === "idle" || phase === "traveling" || phase === "delivered" ? phase : phase;
}

export function PacketJourney() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [speedIdx, setSpeedIdx] = useState(1);
  const [running, setRunning] = useState(false);
  const [selectedField, setSelectedField] = useState<{
    layer: LayerKey;
    field: string;
  } | null>(null);

  const stepIndexRef = useRef(0);
  const cancelRef = useRef(false);

  const layers = useMemo(() => buildLayers(input), [input]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    stepIndexRef.current = 0;
    setRunning(false);
    setPhase("idle");
    setSelectedField(null);
  }, []);

  const start = useCallback(() => {
    cancelRef.current = false;
    stepIndexRef.current = 0;
    setRunning(true);
    setPhase(TIMELINE[0]);
  }, []);

  useEffect(() => {
    if (!running) return;
    const next = TIMELINE[stepIndexRef.current + 1];
    if (!next) {
      setRunning(false);
      return;
    }
    const stepDuration = phase === "traveling" ? BASE_STEP_MS * 1.6 : BASE_STEP_MS;
    const t = window.setTimeout(() => {
      if (cancelRef.current) return;
      stepIndexRef.current += 1;
      setPhase(next);
    }, stepDuration * SPEEDS[speedIdx].multiplier);
    return () => window.clearTimeout(t);
  }, [running, phase, speedIdx]);

  const pause = () => setRunning(false);
  const resume = () => {
    if (phase === "delivered") return;
    setRunning(true);
  };

  const src = srcStack(phase);
  const dst = dstStack(phase);
  const active = activeLayerKey(phase);
  const wrapStack = useMemo(() => {
    if (phase === "idle") return [];
    if (phase === "traveling" || phase === "delivered" || phase.startsWith("decap-")) {
      const remainingDst = dst;
      return LAYER_ORDER.filter((k) => !remainingDst.includes(k) || k === active);
    }
    return src;
  }, [phase, src, dst, active]);

  return (
    <div className="grid gap-6">
      <ControlPanel
        input={input}
        onInputChange={setInput}
        onStart={start}
        onReset={reset}
        onPause={pause}
        onResume={resume}
        running={running}
        phase={phase}
        speedIdx={speedIdx}
        onSpeedChange={setSpeedIdx}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stack View</CardTitle>
              <Badge variant="primary">
                {phase === "idle"
                  ? "Ready"
                  : phase === "delivered"
                    ? "Delivered"
                    : phase === "traveling"
                      ? "In flight"
                      : phase.startsWith("encap")
                        ? "Encapsulating"
                        : "Decapsulating"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-6">
              <HostStack
                title="Source host"
                ip={input.srcIp}
                layers={layers}
                stacked={src}
                active={phase.startsWith("encap-") ? active : null}
                direction="down"
                onLayerClick={(k) => setSelectedField({ layer: k, field: "" })}
              />
              <div className="relative flex w-32 items-center justify-center">
                <PathTrack phase={phase} />
              </div>
              <HostStack
                title="Destination host"
                ip={input.dstIp}
                layers={layers}
                stacked={dst}
                active={phase.startsWith("decap-") ? active : null}
                direction="up"
                onLayerClick={(k) => setSelectedField({ layer: k, field: "" })}
              />
            </div>

            <div className="mt-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current PDU
              </p>
              <PduStrip layers={layers} stack={wrapStack} active={active} />
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm">{PHASE_DESCRIPTIONS[descriptionKey(phase)] ?? ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <HeaderInspector
          layers={layers}
          activeLayer={active}
          selected={selectedField}
          onSelect={setSelectedField}
        />
      </div>
    </div>
  );
}

function ControlPanel({
  input,
  onInputChange,
  onStart,
  onReset,
  onPause,
  onResume,
  running,
  phase,
  speedIdx,
  onSpeedChange,
}: {
  input: SimulationInput;
  onInputChange: (i: SimulationInput) => void;
  onStart: () => void;
  onReset: () => void;
  onPause: () => void;
  onResume: () => void;
  running: boolean;
  phase: Phase;
  speedIdx: number;
  onSpeedChange: (i: number) => void;
}) {
  const inFlight = phase !== "idle" && phase !== "delivered";
  return (
    <Card>
      <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Message"
            value={input.message}
            onChange={(v) => onInputChange({ ...input, message: v })}
          />
          <Field
            label="Source IP"
            value={input.srcIp}
            onChange={(v) => onInputChange({ ...input, srcIp: v })}
            mono
          />
          <Field
            label="Destination IP"
            value={input.dstIp}
            onChange={(v) => onInputChange({ ...input, dstIp: v })}
            mono
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <div className="flex items-center rounded-md border border-border bg-card p-0.5 text-xs">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSpeedChange(i)}
                className={cn(
                  "rounded-sm px-2 py-1 transition-colors",
                  i === speedIdx ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {phase === "idle" || phase === "delivered" ? (
            <Button onClick={phase === "delivered" ? () => { onReset(); onStart(); } : onStart}>
              <Send className="h-4 w-4" /> {phase === "delivered" ? "Replay" : "Send packet"}
            </Button>
          ) : running ? (
            <Button variant="secondary" onClick={onPause}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          ) : (
            <Button onClick={onResume}>
              <Play className="h-4 w-4" /> Resume
            </Button>
          )}
          <Button variant="outline" onClick={onReset} disabled={!inFlight && phase === "idle"}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring",
          mono && "font-mono",
        )}
      />
    </label>
  );
}

function HostStack({
  title,
  ip,
  layers,
  stacked,
  active,
  direction,
  onLayerClick,
}: {
  title: string;
  ip: string;
  layers: LayerSpec[];
  stacked: LayerKey[];
  active: LayerKey | null;
  direction: "up" | "down";
  onLayerClick: (k: LayerKey) => void;
}) {
  const order = direction === "down" ? layers : [...layers].reverse();
  return (
    <div className="flex flex-col">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mb-3 font-mono text-xs text-foreground/80">{ip}</p>
      <ol className="flex flex-col gap-1.5">
        {order.map((l) => {
          const present = stacked.includes(l.key);
          const isActive = active === l.key;
          return (
            <motion.li
              key={l.key}
              layout
              initial={false}
              animate={{
                opacity: present ? 1 : 0.25,
                scale: isActive ? 1.03 : 1,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onClick={() => onLayerClick(l.key)}
              className={cn(
                "group flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm",
                isActive && "ring-2",
              )}
              style={{
                background: present
                  ? `color-mix(in oklab, ${l.colorVar} 14%, transparent)`
                  : "transparent",
                borderColor: present
                  ? `color-mix(in oklab, ${l.colorVar} 35%, var(--color-border))`
                  : undefined,
                ...(isActive
                  ? ({ "--tw-ring-color": l.colorVar } as React.CSSProperties)
                  : {}),
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: l.colorVar }}
                  aria-hidden
                />
                <span className="font-medium">{l.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{l.pdu}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function PathTrack({ phase }: { phase: Phase }) {
  const traveling = phase === "traveling";
  const delivered = phase !== "idle" && phase !== "traveling" && !phase.startsWith("encap-");
  const ready = phase.startsWith("encap-") || phase === "encap-physical";
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      <svg
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
        viewBox="0 0 120 24"
        preserveAspectRatio="none"
      >
        <line
          x1="6"
          x2="114"
          y1="12"
          y2="12"
          stroke="var(--color-primary)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity={traveling ? 0.9 : 0.25}
          style={{
            animation: traveling ? "dash-flow 1.2s linear infinite" : undefined,
          }}
        />
      </svg>
      <AnimatePresence>
        {(traveling || delivered || ready) && (
          <motion.div
            key="packet"
            initial={{ x: "-50%", left: "0%", opacity: 0 }}
            animate={{
              left: traveling ? "100%" : delivered ? "100%" : "0%",
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              left: { duration: traveling ? 1.6 : 0.4, ease: "easeInOut" },
              opacity: { duration: 0.25 },
            }}
            className="absolute top-1/2 -translate-y-1/2"
          >
            <div className="grid h-9 w-9 -translate-x-1/2 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Send className="h-4 w-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PduStrip({
  layers,
  stack,
  active,
}: {
  layers: LayerSpec[];
  stack: LayerKey[];
  active: LayerKey | null;
}) {
  const visible = layers.filter((l) => stack.includes(l.key) && l.key !== "physical");
  return (
    <div className="overflow-x-auto">
      <div className="flex min-h-[58px] items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2">
        <AnimatePresence initial={false}>
          {visible.length === 0 && (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2 text-xs text-muted-foreground"
            >
              No PDU yet — press Send.
            </motion.span>
          )}
          {visible.map((l) => (
            <motion.div
              key={l.key}
              layout
              initial={{ opacity: 0, scale: 0.92, x: 16 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: -16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium",
                active === l.key && "ring-2",
              )}
              style={{
                background: `color-mix(in oklab, ${l.colorVar} 22%, transparent)`,
                color: l.colorVar,
                ...(active === l.key
                  ? ({ "--tw-ring-color": l.colorVar } as React.CSSProperties)
                  : {}),
              }}
            >
              <span className="font-mono uppercase">{l.shortLabel}</span>
              <span className="text-foreground/70">hdr</span>
            </motion.div>
          ))}
          {visible.length > 0 && (
            <motion.div
              key="payload"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              payload
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HeaderInspector({
  layers,
  activeLayer,
  selected,
  onSelect,
}: {
  layers: LayerSpec[];
  activeLayer: LayerKey | null;
  selected: { layer: LayerKey; field: string } | null;
  onSelect: (s: { layer: LayerKey; field: string } | null) => void;
}) {
  const focusKey = selected?.layer ?? activeLayer ?? "transport";
  const focus = layers.find((l) => l.key === focusKey)!;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <CardTitle>Header Inspector</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{focus.description}</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-1.5">
          {layers.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => onSelect({ layer: l.key, field: "" })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                focusKey === l.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={{
                background:
                  focusKey === l.key
                    ? `color-mix(in oklab, ${l.colorVar} 22%, transparent)`
                    : "transparent",
              }}
            >
              {l.shortLabel}
            </button>
          ))}
        </div>
        <ul className="grid gap-2">
          {focus.headerFields.map((f) => {
            const isSelected = selected?.layer === focus.key && selected.field === f.name;
            return (
              <li
                key={f.name}
                onClick={() =>
                  onSelect(isSelected ? null : { layer: focus.key, field: f.name })
                }
                className={cn(
                  "cursor-pointer rounded-md border border-border bg-card p-3 text-sm transition-colors hover:bg-muted",
                  isSelected && "ring-1",
                )}
                style={
                  isSelected
                    ? ({ "--tw-ring-color": focus.colorVar } as React.CSSProperties)
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.name}
                  </span>
                  <span className="font-mono text-xs">{f.value}</span>
                </div>
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      {f.tooltip}
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
