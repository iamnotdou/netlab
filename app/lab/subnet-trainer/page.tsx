import { LabShell } from "@/components/lab/lab-shell";
import { SubnetTrainer } from "@/components/lab/subnet-trainer/subnet-trainer";
import { getModule } from "@/lib/modules";

const MODULE = getModule("subnet-trainer")!;

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
      <SubnetTrainer />
    </LabShell>
  );
}
