import { LabShell } from "@/components/lab/lab-shell";
import { PacketJourney } from "@/components/lab/packet-journey/packet-journey";
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
      <PacketJourney />
    </LabShell>
  );
}
