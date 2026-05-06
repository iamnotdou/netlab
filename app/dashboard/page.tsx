import { LabShell } from "@/components/lab/lab-shell";
import { Dashboard } from "@/components/lab/dashboard/dashboard";

export const metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <LabShell
      title="Dashboard"
      tagline="Your quiz history, category radar, and recent score trend — all stored locally in your browser."
      chapter="Personal"
      topics={["Progress", "Scores"]}
    >
      <Dashboard />
    </LabShell>
  );
}
