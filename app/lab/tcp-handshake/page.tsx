import { LabShell } from "@/components/lab/lab-shell";
import { TcpHandshake } from "@/components/lab/tcp-handshake/tcp-handshake";
import { getModule } from "@/lib/modules";

const MODULE = getModule("tcp-handshake")!;

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
      <TcpHandshake />
    </LabShell>
  );
}
