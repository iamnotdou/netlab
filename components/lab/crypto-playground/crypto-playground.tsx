"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Hash, Wand2, Lock } from "lucide-react";
import {
  buildRsaDemo,
  caesarShift,
  demoHash,
  modPow,
  vigenere,
} from "@/lib/network/crypto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "caesar" | "vigenere" | "rsa" | "hash";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "caesar", label: "Caesar", icon: Wand2 },
  { id: "vigenere", label: "Vigenère", icon: KeyRound },
  { id: "rsa", label: "RSA (mini)", icon: Lock },
  { id: "hash", label: "Hash avalanche", icon: Hash },
];

export function CryptoPlayground() {
  const [tab, setTab] = useState<Tab>("caesar");
  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "caesar" && <Caesar />}
          {tab === "vigenere" && <Vigenere />}
          {tab === "rsa" && <Rsa />}
          {tab === "hash" && <HashAvalanche />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Caesar() {
  const [text, setText] = useState("Attack at dawn");
  const [shift, setShift] = useState(3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caesar cipher</CardTitle>
        <p className="text-sm text-muted-foreground">
          Each letter is shifted by a fixed offset. The simplest cipher in the world — and the
          easiest to break with frequency analysis.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Plaintext
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shift: {shift}
          </span>
          <input
            type="range"
            min={0}
            max={25}
            value={shift}
            onChange={(e) => setShift(Number(e.target.value))}
            className="accent-[var(--color-primary)]"
          />
        </label>
        <CharacterMorph text={text} shift={shift} />
        <div className="grid gap-2 rounded-md border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Ciphertext</div>
          <div className="font-mono text-sm">{caesarShift(text, shift)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterMorph({ text, shift }: { text: string; shift: number }) {
  const cipher = caesarShift(text, shift);
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(36px,1fr))] gap-1">
        {Array.from(text).map((ch, i) => (
          <div
            key={i}
            className="grid place-items-center rounded-md border border-border bg-card p-2 font-mono text-xs"
          >
            <span className="text-muted-foreground">{ch === " " ? "·" : ch}</span>
            <motion.span
              key={`${ch}-${shift}`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.01 }}
              className="text-primary"
            >
              {cipher[i] === " " ? "·" : cipher[i]}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Vigenere() {
  const [text, setText] = useState("Meet me at the bridge");
  const [key, setKey] = useState("LEMON");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

  const result = useMemo(() => vigenere(text, key, mode), [text, key, mode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vigenère cipher</CardTitle>
        <p className="text-sm text-muted-foreground">
          A polyalphabetic cipher: each letter of the key shifts the corresponding letter of the
          plaintext. Resists frequency analysis better than Caesar.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Text
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Key
            </span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:border-ring"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
            {(["encrypt", "decrypt"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-sm px-2 py-1 transition-colors",
                  mode === m ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 rounded-md border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
          </div>
          <div className="font-mono text-sm">{result}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Rsa() {
  const [p, setP] = useState(11);
  const [q, setQ] = useState(13);
  const [e, setE] = useState(7);
  const [m, setM] = useState(42);

  const demo = useMemo(() => buildRsaDemo(p, q, e), [p, q, e]);
  const c = useMemo(() => modPow(m, demo.e, demo.n), [m, demo.e, demo.n]);
  const decrypted = useMemo(() => modPow(c, demo.d, demo.n), [c, demo.d, demo.n]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSA (mini)</CardTitle>
        <p className="text-sm text-muted-foreground">
          A pedagogical RSA with tiny primes. Real RSA uses 2048-bit primes — same math, much
          bigger numbers.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <NumberField label="Prime p" value={p} onChange={setP} />
          <NumberField label="Prime q" value={q} onChange={setQ} />
          <NumberField label="Public e" value={e} onChange={setE} />
          <NumberField label="Plaintext m" value={m} onChange={setM} />
        </div>
        <div className="grid gap-2">
          {demo.steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3 text-sm"
            >
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-mono">{s.value}</span>
            </motion.div>
          ))}
        </div>
        <div className="grid gap-2 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Encrypt: c = m^e mod n</span>
            <span className="font-mono">
              c = {m}^{demo.e} mod {demo.n} = <Badge variant="primary">{c}</Badge>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Decrypt: m = c^d mod n</span>
            <span className="font-mono">
              m = {c}^{demo.d} mod {demo.n} = <Badge variant="accent">{decrypted}</Badge>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(ev) => onChange(Math.max(2, Number(ev.target.value)))}
        className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
      />
    </label>
  );
}

function HashAvalanche() {
  const [a, setA] = useState("hello world");
  const [b, setB] = useState("hello worle");

  const ha = demoHash(a);
  const hb = demoHash(b);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hash avalanche effect</CardTitle>
        <p className="text-sm text-muted-foreground">
          A single-character change in the input produces a wildly different digest. This is the
          property real hash functions like SHA-256 are designed for.
        </p>
        <p className="mt-1 text-xs text-warn">
          Educational hash only — not cryptographically secure. Real apps must use SHA-256+.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Input A
            </span>
            <input
              value={a}
              onChange={(ev) => setA(ev.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Input B
            </span>
            <input
              value={b}
              onChange={(ev) => setB(ev.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
        </div>
        <DigestRow label="hash(A)" digest={ha} other={hb} />
        <DigestRow label="hash(B)" digest={hb} other={ha} />
        <DiffSummary a={ha} b={hb} />
      </CardContent>
    </Card>
  );
}

function DigestRow({ label, digest, other }: { label: string; digest: string; other: string }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-xs leading-6">
        {Array.from(digest).map((ch, i) => {
          const diff = ch !== other[i];
          return (
            <span
              key={i}
              className={cn(
                "transition-colors",
                diff ? "rounded-sm bg-danger/20 px-0.5 text-danger" : "text-foreground/80",
              )}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DiffSummary({ a, b }: { a: string; b: string }) {
  let diff = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) diff++;
  }
  const pct = Math.round((diff / a.length) * 100);
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
      Differing characters:{" "}
      <span className="font-mono">
        {diff}/{a.length}
      </span>{" "}
      ({pct}%) — even a 1-character input change can flip ~50% of digest characters.
    </div>
  );
}
