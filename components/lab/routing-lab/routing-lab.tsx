"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Flag,
  Target,
  Minus,
  Plus,
} from "lucide-react";
import {
  DEFAULT_GRAPH,
  dijkstra,
  linkKey,
  pathLinkKeys,
  reconstructPath,
  type Graph,
  type Link,
} from "@/lib/network/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 2] as const;
const STEP_MS = 1400;

export function RoutingLab() {
  const [links, setLinks] = useState<Link[]>(() =>
    DEFAULT_GRAPH.links.map((l) => ({ ...l })),
  );
  const [source, setSource] = useState("A");
  const [target, setTarget] = useState("G");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  const graph: Graph = useMemo(
    () => ({ nodes: DEFAULT_GRAPH.nodes, links }),
    [links],
  );

  const steps = useMemo(() => dijkstra(graph, source), [graph, source]);

  // Reset playback whenever the graph or source changes.
  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [steps]);

  const atEnd = stepIdx >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStepIdx((i) => i + 1), STEP_MS / speed);
    return () => clearTimeout(id);
  }, [playing, stepIdx, atEnd, speed]);

  const step = steps[stepIdx];

  const path = useMemo(
    () => reconstructPath(step.prev, source, target),
    [step.prev, source, target],
  );
  const pathKeys = useMemo(() => pathLinkKeys(path), [path]);
  const targetSettled = step.visited.includes(target);

  const nodeState = useCallback(
    (id: string): "current" | "visited" | "frontier" | "idle" => {
      if (step.current === id) return "current";
      if (step.visited.includes(id)) return "visited";
      if (step.frontier.includes(id)) return "frontier";
      return "idle";
    },
    [step],
  );

  const bumpWeight = (l: Link, delta: number) => {
    setLinks((prev) =>
      prev.map((x) =>
        x.a === l.a && x.b === l.b
          ? { ...x, weight: Math.min(20, Math.max(1, x.weight + delta)) }
          : x,
      ),
    );
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Graph canvas */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Link-state topology</CardTitle>
              <Badge variant="outline">Dijkstra · OSPF-style costs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Topology
              graph={graph}
              nodeState={nodeState}
              dist={step.dist}
              pathKeys={pathKeys}
              relaxed={step.relaxed}
              source={source}
              target={target}
              onPick={setSource}
            />
            <Legend />
          </CardContent>
        </Card>

        {/* Controls + endpoints */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <NodePicker
                icon={Flag}
                label="Source"
                nodes={graph.nodes.map((n) => n.id)}
                value={source}
                onChange={setSource}
              />
              <NodePicker
                icon={Target}
                label="Destination"
                nodes={graph.nodes.map((n) => n.id)}
                value={target}
                onChange={setTarget}
                disabled={source}
              />
              <div className="rounded-md border border-border bg-card p-3 text-sm">
                {path.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {targetSettled ? "Shortest path" : "Best path so far"}:
                    </span>
                    <span className="font-mono font-medium">{path.join(" → ")}</span>
                    <Badge variant={targetSettled ? "accent" : "primary"}>
                      cost {step.dist[target]}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {target} not reached yet — keep stepping.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Playback</CardTitle>
                <Badge variant="primary">
                  step {stepIdx}/{steps.length - 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => (atEnd ? setStepIdx(0) : setPlaying((p) => !p))}
                >
                  {atEnd ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Replay
                    </>
                  ) : playing ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Play
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={atEnd}
                  onClick={() => {
                    setPlaying(false);
                    setStepIdx((i) => Math.min(steps.length - 1, i + 1));
                  }}
                >
                  <StepForward className="h-3.5 w-3.5" /> Step
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPlaying(false);
                    setStepIdx(0);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
                <div className="ml-auto flex items-center gap-1">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        speed === s
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <motion.p
                key={stepIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-[3rem] rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
              >
                {step.narration}
              </motion.p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <DistanceTable graph={graph} step={step} source={source} />
        <WeightEditor links={links} onBump={bumpWeight} />
      </div>
    </div>
  );
}

function Topology({
  graph,
  nodeState,
  dist,
  pathKeys,
  relaxed,
  source,
  target,
  onPick,
}: {
  graph: Graph;
  nodeState: (id: string) => "current" | "visited" | "frontier" | "idle";
  dist: Record<string, number>;
  pathKeys: Set<string>;
  relaxed: string[];
  source: string;
  target: string;
  onPick: (id: string) => void;
}) {
  const pos = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n])),
    [graph.nodes],
  );

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 100 100"
        className="h-[360px] w-full sm:h-[440px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Router topology graph"
      >
        {/* links */}
        {graph.links.map((l) => {
          const a = pos[l.a];
          const b = pos[l.b];
          const onPath = pathKeys.has(linkKey(l.a, l.b));
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={`${l.a}-${l.b}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  onPath ? "var(--color-accent)" : "var(--color-border)"
                }
                strokeWidth={onPath ? 1.4 : 0.7}
                strokeLinecap="round"
              />
              <circle cx={mx} cy={my} r={3.2} fill="var(--color-card)" />
              <text
                x={mx}
                y={my + 1.4}
                textAnchor="middle"
                fontSize={4}
                fontWeight={600}
                fill={onPath ? "var(--color-accent)" : "var(--color-muted-foreground)"}
              >
                {l.weight}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {graph.nodes.map((n) => {
          const state = nodeState(n.id);
          const d = dist[n.id];
          const reachable = d !== Number.POSITIVE_INFINITY;
          const isRelaxed = relaxed.includes(n.id);
          const fill =
            state === "current"
              ? "var(--color-primary)"
              : state === "visited"
                ? "var(--color-accent)"
                : state === "frontier"
                  ? "var(--color-card)"
                  : "var(--color-card)";
          const stroke =
            state === "frontier"
              ? "var(--color-primary)"
              : state === "idle"
                ? "var(--color-border)"
                : fill;
          const textFill =
            state === "current" || state === "visited"
              ? "var(--color-primary-foreground)"
              : "var(--color-foreground)";
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onClick={() => onPick(n.id)}
            >
              {state === "current" && (
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={6}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth={0.6}
                  initial={{ opacity: 0.7, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
              )}
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={5}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.8}
                animate={isRelaxed ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
              <text
                x={n.x}
                y={n.y + 1.6}
                textAnchor="middle"
                fontSize={4.6}
                fontWeight={700}
                fill={textFill}
                pointerEvents="none"
              >
                {n.label}
              </text>
              {/* distance bubble */}
              <text
                x={n.x}
                y={n.y - 6.6}
                textAnchor="middle"
                fontSize={3.6}
                fontWeight={600}
                fill="var(--color-muted-foreground)"
                pointerEvents="none"
              >
                {reachable ? d : "∞"}
              </text>
              {/* endpoint flags */}
              {n.id === source && (
                <text x={n.x - 6.5} y={n.y + 1.6} textAnchor="middle" fontSize={4}>
                  🚩
                </text>
              )}
              {n.id === target && n.id !== source && (
                <text x={n.x + 6.5} y={n.y + 1.6} textAnchor="middle" fontSize={4}>
                  🎯
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Click any router to make it the source. Numbers above each node are the current cost
        from the source.
      </p>
    </div>
  );
}

function Legend() {
  const items: { label: string; cls: string }[] = [
    { label: "current", cls: "bg-primary" },
    { label: "settled", cls: "bg-accent" },
    { label: "frontier", cls: "bg-card ring-1 ring-primary" },
    { label: "shortest path", cls: "bg-accent/40" },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", it.cls)} /> {it.label}
        </span>
      ))}
    </div>
  );
}

function NodePicker({
  icon: Icon,
  label,
  nodes,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  nodes: string[];
  value: string;
  onChange: (id: string) => void;
  /** When set, this node id cannot be chosen (e.g. destination ≠ source). */
  disabled?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {nodes.map((id) => {
          const isDisabled = disabled === id;
          return (
            <button
              key={id}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(id)}
              className={cn(
                "h-8 w-8 rounded-md border text-sm font-semibold transition-colors",
                value === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
                isDisabled && "cursor-not-allowed opacity-30 hover:bg-card",
              )}
            >
              {id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DistanceTable({
  graph,
  step,
  source,
}: {
  graph: Graph;
  step: ReturnType<typeof dijkstra>[number];
  source: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distance table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Router</th>
                <th className="px-3 py-2 text-left font-medium">Cost</th>
                <th className="px-3 py-2 text-left font-medium">Via</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {graph.nodes.map((n) => {
                const d = step.dist[n.id];
                const reachable = d !== Number.POSITIVE_INFINITY;
                const settled = step.visited.includes(n.id);
                const isCurrent = step.current === n.id;
                const isRelaxed = step.relaxed.includes(n.id);
                return (
                  <tr
                    key={n.id}
                    className={cn(
                      "border-t border-border transition-colors",
                      isCurrent && "bg-primary/10",
                      isRelaxed && !isCurrent && "bg-accent/10",
                    )}
                  >
                    <td className="px-3 py-2 font-mono font-medium">{n.id}</td>
                    <td className="px-3 py-2 font-mono">{reachable ? d : "∞"}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {n.id === source ? "—" : (step.prev[n.id] ?? "—")}
                    </td>
                    <td className="px-3 py-2">
                      {settled ? (
                        <Badge variant="accent">settled</Badge>
                      ) : reachable ? (
                        <Badge variant="primary">frontier</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">unreached</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function WeightEditor({
  links,
  onBump,
}: {
  links: Link[];
  onBump: (l: Link, delta: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Link costs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Change a cost and the algorithm re-runs — watch the shortest path reroute.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {links.map((l) => (
            <div
              key={`${l.a}-${l.b}`}
              className="flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5"
            >
              <span className="font-mono text-sm">
                {l.a}–{l.b}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  aria-label={`Decrease ${l.a}-${l.b} cost`}
                  onClick={() => onBump(l, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center font-mono text-sm font-semibold">
                  {l.weight}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  aria-label={`Increase ${l.a}-${l.b} cost`}
                  onClick={() => onBump(l, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
