import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { LabShell } from "@/components/lab/lab-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, type CategoryId } from "@/lib/quiz/types";
import { QUESTIONS } from "@/lib/quiz/questions";

export const metadata = { title: "Quiz Arena" };

const ORDER: CategoryId[] = ["application", "transport", "network", "link", "security"];

export default function Page() {
  return (
    <LabShell
      title="Quiz Arena"
      tagline="100 questions across 5 categories. Pick a focus or take the mixed challenge."
      chapter="All chapters"
      topics={["Application", "Transport", "Network", "Link", "Security"]}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/quiz/mixed" className="group">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)]">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/40">
                  <Sparkles className="h-5 w-5" />
                </span>
                <Badge variant="primary">25 Q</Badge>
              </div>
              <CardTitle>Mixed Challenge</CardTitle>
              <CardDescription>
                25 random questions sampled across all 5 categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center gap-1 text-sm text-primary">
                Start <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        {ORDER.map((c) => {
          const count = QUESTIONS.filter((q) => q.category === c).length;
          return (
            <Link key={c} href={`/quiz/${c}`} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)]">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">{count} questions</Badge>
                    <Badge variant="primary">12 served</Badge>
                  </div>
                  <CardTitle>{CATEGORY_LABELS[c]}</CardTitle>
                  <CardDescription>{CATEGORY_DESCRIPTIONS[c]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </LabShell>
  );
}
