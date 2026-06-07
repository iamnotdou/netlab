// Pure, React-free routing simulation for the Routing Lab.
// Implements Dijkstra's shortest-path algorithm with a full step-by-step trace
// so the UI can replay exactly how a link-state router builds its forwarding table.

export interface RouterNode {
  id: string;
  label: string;
  /** Layout position in a 0–100 viewBox (percent of the SVG canvas). */
  x: number;
  y: number;
}

export interface Link {
  a: string;
  b: string;
  weight: number;
}

export interface Graph {
  nodes: RouterNode[];
  links: Link[];
}

/**
 * A classic 7-router mesh. Weights are link costs (e.g. inverse bandwidth),
 * the way OSPF treats them. Chosen so the shortest path is non-obvious.
 */
export const DEFAULT_GRAPH: Graph = {
  nodes: [
    { id: "A", label: "A", x: 10, y: 50 },
    { id: "B", label: "B", x: 32, y: 18 },
    { id: "C", label: "C", x: 32, y: 82 },
    { id: "D", label: "D", x: 55, y: 50 },
    { id: "E", label: "E", x: 78, y: 20 },
    { id: "F", label: "F", x: 78, y: 80 },
    { id: "G", label: "G", x: 95, y: 50 },
  ],
  links: [
    { a: "A", b: "B", weight: 2 },
    { a: "A", b: "C", weight: 5 },
    { a: "B", b: "C", weight: 2 },
    { a: "B", b: "D", weight: 7 },
    { a: "C", b: "D", weight: 3 },
    { a: "D", b: "E", weight: 4 },
    { a: "D", b: "F", weight: 6 },
    { a: "E", b: "F", weight: 2 },
    { a: "E", b: "G", weight: 5 },
    { a: "F", b: "G", weight: 3 },
  ],
};

export interface DijkstraStep {
  /** Node finalized (removed from the frontier) at this step; null for the init step. */
  current: string | null;
  /** Best known cost from the source to every node so far. */
  dist: Record<string, number>;
  /** Predecessor on the current best path, for path reconstruction. */
  prev: Record<string, string | null>;
  /** Nodes already finalized (shortest cost is known and permanent). */
  visited: string[];
  /** Reachable-but-not-yet-finalized nodes — the priority queue contents. */
  frontier: string[];
  /** Neighbor ids whose tentative distance was lowered during this step. */
  relaxed: string[];
  narration: string;
}

const INF = Number.POSITIVE_INFINITY;

function buildAdjacency(graph: Graph): Record<string, { to: string; weight: number }[]> {
  const adj: Record<string, { to: string; weight: number }[]> = {};
  for (const n of graph.nodes) adj[n.id] = [];
  for (const l of graph.links) {
    adj[l.a].push({ to: l.b, weight: l.weight });
    adj[l.b].push({ to: l.a, weight: l.weight });
  }
  return adj;
}

/**
 * Run Dijkstra from `source`, returning one DijkstraStep per node finalized
 * (plus an initial step). The trace never mutates its earlier entries.
 */
export function dijkstra(graph: Graph, source: string): DijkstraStep[] {
  const adj = buildAdjacency(graph);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const n of graph.nodes) {
    dist[n.id] = INF;
    prev[n.id] = null;
  }
  dist[source] = 0;

  const frontierOf = () =>
    graph.nodes
      .map((n) => n.id)
      .filter((id) => !visited.has(id) && dist[id] < INF)
      .sort((x, y) => dist[x] - dist[y]);

  const steps: DijkstraStep[] = [
    {
      current: null,
      dist: { ...dist },
      prev: { ...prev },
      visited: [],
      frontier: frontierOf(),
      relaxed: [],
      narration: `Initialize: cost to ${source} is 0, every other router is ∞. The frontier holds only ${source}.`,
    },
  ];

  while (visited.size < graph.nodes.length) {
    // Pick the unvisited node with the smallest tentative distance.
    let current: string | null = null;
    let best = INF;
    for (const n of graph.nodes) {
      if (!visited.has(n.id) && dist[n.id] < best) {
        best = dist[n.id];
        current = n.id;
      }
    }
    if (current === null) break; // remaining nodes are unreachable

    visited.add(current);

    // Relax every neighbor of the finalized node.
    const relaxed: string[] = [];
    for (const edge of adj[current]) {
      if (visited.has(edge.to)) continue;
      const candidate = dist[current] + edge.weight;
      if (candidate < dist[edge.to]) {
        dist[edge.to] = candidate;
        prev[edge.to] = current;
        relaxed.push(edge.to);
      }
    }

    const relaxNote = relaxed.length
      ? `Relaxed ${relaxed
          .map((r) => `${r} (→ ${dist[r]})`)
          .join(", ")}.`
      : "No neighbor's cost improved.";

    steps.push({
      current,
      dist: { ...dist },
      prev: { ...prev },
      visited: [...visited],
      frontier: frontierOf(),
      relaxed,
      narration: `Finalize ${current} at cost ${dist[current]} — it now has the lowest cost in the frontier, so its shortest path is settled. ${relaxNote}`,
    });
  }

  return steps;
}

/** Reconstruct the shortest path source→target from a finished `prev` map. */
export function reconstructPath(
  prev: Record<string, string | null>,
  source: string,
  target: string,
): string[] {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur) {
    path.unshift(cur);
    if (cur === source) return path;
    cur = prev[cur];
  }
  return []; // unreachable
}

/** Set of "a|b" link keys (order-independent) that make up a path. */
export function pathLinkKeys(path: string[]): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    keys.add(linkKey(path[i], path[i + 1]));
  }
  return keys;
}

export function linkKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
