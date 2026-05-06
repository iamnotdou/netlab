import { notFound } from "next/navigation";
import { LabShell } from "@/components/lab/lab-shell";
import { QuizRunner } from "@/components/lab/quiz/quiz-runner";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/quiz/types";

const VALID = new Set<string>([
  "application",
  "transport",
  "network",
  "link",
  "security",
  "mixed",
]);

export function generateStaticParams() {
  return Array.from(VALID).map((category) => ({ category }));
}

export const dynamicParams = false;

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { category } = await params;
  const label =
    category === "mixed"
      ? "Mixed Challenge"
      : CATEGORY_LABELS[category as CategoryId] ?? "Quiz";
  return { title: `${label} · Quiz` };
}

export default async function Page({ params }: { params: Params }) {
  const { category } = await params;
  if (!VALID.has(category)) notFound();
  const label =
    category === "mixed"
      ? "Mixed Challenge"
      : CATEGORY_LABELS[category as CategoryId];
  return (
    <LabShell
      title={label}
      tagline="Answer each question, see the explanation, and finish to earn a certificate."
      chapter="Quiz"
      topics={category === "mixed" ? ["All categories"] : [label]}
    >
      <QuizRunner category={category as CategoryId | "mixed"} />
    </LabShell>
  );
}
