import { LabShell } from "@/components/lab/lab-shell";

export const metadata = { title: "Quiz Arena" };

export default function Page() {
  return (
    <LabShell
      title="Quiz Arena"
      tagline="100 questions across 5 categories. Pick your challenge."
      chapter="All chapters"
      topics={["Application", "Transport", "Network", "Link", "Security"]}
    >
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        Coming online — quiz runner will mount here.
      </div>
    </LabShell>
  );
}
