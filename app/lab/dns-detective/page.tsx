import { LabShell } from "@/components/lab/lab-shell";
import { DnsDetective } from "@/components/lab/dns-detective/dns-detective";
import { getModule } from "@/lib/modules";

const MODULE = getModule("dns-detective")!;

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
      <DnsDetective />
    </LabShell>
  );
}
