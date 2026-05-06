import Link from "next/link";
import { ArrowRight, Sparkles, GraduationCap, Layers, Activity } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULES, ACCENT_CLASSES } from "@/lib/modules";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(245_90%_70%/0.18),transparent_60%)]"
        />
        <Container className="relative py-20 sm:py-28">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="primary">
              <Sparkles className="mr-1 h-3 w-3" /> BTO3102 · Spring 2026 · CEIT/BÖTE
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              A computer networks classroom
              <span className="text-primary"> you can actually click on.</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              NetLab turns the Kurose &amp; Ross syllabus into five hands-on, animated labs —
              from packet encapsulation to RSA — designed for the way CEIT students learn best.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/lab/packet-journey"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-colors hover:bg-primary/90"
              >
                Start with Packet Journey <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/quiz"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-6 text-base font-medium transition-colors hover:bg-muted"
              >
                Jump into Quiz Arena
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <Stat icon={Layers} label="5 interactive labs" />
              <Stat icon={Activity} label="100 quiz questions" />
              <Stat icon={GraduationCap} label="Pedagogy-first design" />
            </div>
          </div>
        </Container>
      </section>

      {/* Modules grid */}
      <section className="border-b border-border">
        <Container className="py-16">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Five labs. One stack.
              </h2>
              <p className="mt-1 text-muted-foreground">
                Each lab maps to specific Kurose &amp; Ross chapters and Bloom-taxonomy levels.
              </p>
            </div>
            <Link
              href="/quiz"
              className="hidden text-sm font-medium text-primary hover:underline sm:block"
            >
              Skip to quiz →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const accent = ACCENT_CLASSES[m.accent];
              const Icon = m.icon;
              return (
                <Link key={m.slug} href={m.href} className="group">
                  <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)]">
                    <CardHeader>
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-lg ring-1",
                            accent.bg,
                            accent.text,
                            accent.ring,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <Badge variant="outline">{m.chapter}</Badge>
                      </div>
                      <CardTitle>{m.title}</CardTitle>
                      <CardDescription className="text-foreground/70">
                        {m.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {m.topics.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Pedagogy strip */}
      <section>
        <Container className="py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Pillar
              title="Mayer's Multimedia Principles"
              body="Spatial contiguity, signaling, segmentation. Headers live next to the packet they belong to; one concept at a time."
            />
            <Pillar
              title="Bloom's Taxonomy"
              body="Labs cover Remember → Apply → Analyze. The dashboard tracks where you are on each axis."
            />
            <Pillar
              title="Constructivism"
              body="No passive lectures. Slide the mask, drag the packet, watch the cipher morph — concepts surface from your actions."
            />
          </div>
        </Container>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
