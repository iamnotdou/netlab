import { LabShell } from "@/components/lab/lab-shell";
import { CryptoPlayground } from "@/components/lab/crypto-playground/crypto-playground";
import { getModule } from "@/lib/modules";

const MODULE = getModule("crypto-playground")!;

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
      <CryptoPlayground />
    </LabShell>
  );
}
