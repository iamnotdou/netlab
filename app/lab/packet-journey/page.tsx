import { LabShell } from "@/components/lab/lab-shell";
import { getModule } from "@/lib/modules";

const MODULE = getModule("packet-journey")!;

export const metadata = {
  title: MODULE.title,
  description: MODULE.description,
};

export default function Page() {
  return (
    <LabShell
      title={MODULE.title}
      tagline={MODULE.description}
      chapter={MODULE.chapter}
      topics={MODULE.topics}
    >
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        Coming online — animation engine will mount here.
      </div>
    </LabShell>
  );
}
