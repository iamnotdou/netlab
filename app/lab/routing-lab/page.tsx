import { LabShell } from "@/components/lab/lab-shell";
import { RoutingLab } from "@/components/lab/routing-lab/routing-lab";
import { getModule } from "@/lib/modules";

const MODULE = getModule("routing-lab")!;

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
      <RoutingLab />
    </LabShell>
  );
}
