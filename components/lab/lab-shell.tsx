import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export function LabShell({
  title,
  tagline,
  chapter,
  topics,
  children,
}: {
  title: string;
  tagline: string;
  chapter: string;
  topics: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <Container className="py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{chapter}</Badge>
              {topics.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-muted-foreground">{tagline}</p>
          </div>
        </Container>
      </section>
      <section className="py-10">
        <Container>{children}</Container>
      </section>
    </div>
  );
}
