# NetLab — Interactive Computer Networks Laboratory

> **Team 12 — Doguhan Ozyilmaz** · BTO3102 Computer Networks · Spring 2026 · YTÜ BÖTE

NetLab is a hands-on, animated learning environment that turns the BTO3102 syllabus into five
interactive labs and a 100-question quiz arena. It is built with the way CEIT/BÖTE students
learn in mind — every interaction is grounded in pedagogy (Mayer's multimedia principles,
Bloom's taxonomy, Constructivism) and every concept can be touched, dragged, and replayed.

## Live demo

**https://netlab-opal.vercel.app**

## Modules

| # | Module | Topic | Chapter |
|---|---|---|---|
| 1 | **Packet Journey** | Animated 5-layer encapsulation/decapsulation with header inspector | 1 – 6 |
| 2 | **TCP Handshake Lab** | SYN / SYN-ACK / ACK animation synced with both state machines | 3 |
| 3 | **DNS Detective** | Recursive resolution topology with animated query/referral/answer hops | 2 |
| 4 | **Subnet Trainer** | CIDR slider + bit grid visualization + 8-question drill mode | 4 |
| 5 | **Crypto Playground** | Caesar, Vigenère, mini RSA, hash avalanche | 8 |

Plus:

- **Quiz Arena** — 100 questions across 5 categories; a "mixed challenge" samples 25 across all.
  Confetti + downloadable PNG certificate on a passing score.
- **Dashboard** — local-storage-persisted history with Recharts radar (best per category) and
  recent-attempts bar chart.

## Pedagogical framing

NetLab is not "yet another networking simulator". Every design decision is anchored to a
learning theory:

- **Mayer's Cognitive Theory of Multimedia Learning** — spatial contiguity (headers next to
  the packets they describe), signaling (active layer is highlighted, others dim), segmentation
  (one transition per click; pace control with 0.5×/1×/2× speeds), modality (visual + concise
  text, never duplicated narration).
- **Bloom's Taxonomy** — Remember (badges, definitions), Understand (animations), Apply (drill
  mode, quiz), Analyze (dashboard radar reveals weak spots), Evaluate (history trend).
- **Constructivism** — labs are interactive: slide the CIDR mask, drag the packet, change the
  Caesar shift. Knowledge is constructed through manipulation, not consumed through lecture.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict, ES2020 target)
- **Tailwind CSS v4** with `@theme` design tokens (light/dark via `next-themes`)
- **Framer Motion** for layout, page, and packet animations
- **Zustand** + persist middleware for progress
- **Recharts** for dashboard visualizations
- **Lucide** icons, **Geist** + **Geist Mono** typography
- **canvas-confetti** + **html2canvas** for the certificate

## Project structure

```
app/                  # Next.js routes
  lab/<slug>/         # Five lab pages
  quiz/[category]/    # Statically-rendered quiz routes
  dashboard/          # Personal stats
components/
  ui/                 # Button, Card, Badge, Container primitives
  shared/             # Header, footer, theme toggle
  lab/<module>/       # One folder per lab
lib/
  network/            # Pure simulation logic (testable, no React)
  quiz/               # Question bank, types, Zustand store
  utils.ts            # cn() helper
```

## Local development

Requires Node.js 20.9+.

```bash
pnpm install
pnpm dev       # http://localhost:3000
```

## Production build

```bash
pnpm build     # next build via Turbopack
pnpm start     # serve the production build
```

## Deployment

The app is fully static (every route prerenders). Hosting works on:

- **Vercel** — push to `main`, the connected project deploys automatically
- **GitHub Pages** — set `output: "export"` and run `pnpm build`

## AI-assisted development note

This project was implemented with AI assistance (Claude). Architecture decisions, pedagogical
framing, module scopes, and the question bank were authored and reviewed by the human; the AI
accelerated the React/animation implementation. Every commit was hand-verified with a clean
production build before push.

## License

This is coursework for BTO3102. All rights reserved by the author.
