import { LabShell } from "@/components/lab/lab-shell";

export const metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <LabShell
      title="Dashboard"
      tagline="Track your progress across labs and quiz categories."
      chapter="Personal"
      topics={["Progress", "Scores"]}
    >
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        Coming online — your stats will live here.
      </div>
    </LabShell>
  );
}
