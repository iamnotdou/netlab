"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Trophy, History, Trash2 } from "lucide-react";
import { useProgress, bestPerCategory } from "@/lib/quiz/store";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/quiz/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES: CategoryId[] = ["application", "transport", "network", "link", "security"];

export function Dashboard() {
  const attempts = useProgress((s) => s.attempts);
  const reset = useProgress((s) => s.reset);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="grid gap-4 p-10 text-center">
          <p className="text-muted-foreground">
            No quiz attempts yet. Take a quiz and your stats will appear here.
          </p>
          <div>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Quiz Arena
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const best = bestPerCategory(attempts);
  const radarData = CATEGORIES.map((c) => ({
    category: CATEGORY_LABELS[c].split(" ")[0],
    score: best[c] ?? 0,
  }));
  const recentBars = attempts
    .slice(0, 8)
    .reverse()
    .map((a, i) => ({
      n: `#${i + 1}`,
      pct: Math.round((a.correct / Math.max(1, a.total)) * 100),
    }));

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Attempts"
          value={String(attempts.length)}
          hint="Total quizzes you've completed"
        />
        <KpiCard
          title="Best score"
          value={`${Math.max(...attempts.map((a) => Math.round((a.correct / a.total) * 100)))}%`}
          hint="Top result across all attempts"
        />
        <KpiCard
          title="Avg score"
          value={`${Math.round(
            attempts.reduce((s, a) => s + a.correct / a.total, 0) /
              attempts.length *
              100,
          )}%`}
          hint="Mean performance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                  <Radar
                    name="Best %"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 8 attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={recentBars}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="n" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pct" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle>History</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Clear all attempts?")) reset();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {attempts.slice(0, 12).map((a) => {
              const pct = Math.round((a.correct / Math.max(1, a.total)) * 100);
              const label =
                a.category === "mixed" ? "Mixed" : CATEGORY_LABELS[a.category as CategoryId];
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {a.correct}/{a.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(a.finishedAt).toLocaleString()}</span>
                    <Badge variant={pct >= 70 ? "primary" : "outline"}>{pct}%</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="grid gap-1 p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
