export function caesarShift(text: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26;
  return Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + s) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + s) % 26) + 97);
      return ch;
    })
    .join("");
}

export function vigenere(text: string, key: string, mode: "encrypt" | "decrypt"): string {
  if (!key) return text;
  const cleanedKey = key
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  if (cleanedKey.length === 0) return text;
  let ki = 0;
  return Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;
      if (!isUpper && !isLower) return ch;
      const base = isUpper ? 65 : 97;
      const shift = cleanedKey.charCodeAt(ki % cleanedKey.length) - 65;
      ki++;
      const value =
        mode === "encrypt" ? (code - base + shift) % 26 : (code - base - shift + 26) % 26;
      return String.fromCharCode(value + base);
    })
    .join("");
}

// Tiny RSA demo with small primes — pedagogical only.
export interface RsaDemo {
  p: number;
  q: number;
  n: number;
  phi: number;
  e: number;
  d: number;
  steps: { label: string; value: string }[];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function modInverse(e: number, phi: number): number {
  for (let d = 2; d < phi; d++) {
    if ((e * d) % phi === 1) return d;
  }
  return 1;
}

export function buildRsaDemo(p: number, q: number, e: number): RsaDemo {
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  const d = modInverse(e, phi);
  return {
    p,
    q,
    n,
    phi,
    e,
    d,
    steps: [
      { label: "Pick two primes p, q", value: `p = ${p}, q = ${q}` },
      { label: "Compute n = p × q (the modulus)", value: `n = ${n}` },
      {
        label: "Compute φ(n) = (p−1)(q−1)",
        value: `φ(n) = ${phi}`,
      },
      {
        label: "Choose public exponent e (coprime with φ)",
        value: `e = ${e}, gcd(e, φ) = ${gcd(e, phi)}`,
      },
      {
        label: "Find d such that (e × d) mod φ = 1",
        value: `d = ${d}`,
      },
      {
        label: "Public key (e, n)",
        value: `(${e}, ${n})`,
      },
      {
        label: "Private key (d, n)",
        value: `(${d}, ${n})`,
      },
    ],
  };
}

export function modPow(base: number, exp: number, mod: number): number {
  let r = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) r = (r * b) % mod;
    e >>= 1;
    b = (b * b) % mod;
  }
  return r;
}

// Demo "hash": a deterministic mixing function — NOT cryptographically secure.
// Used to illustrate avalanche effect for class purposes only.
export function demoHash(input: string): string {
  let h1 = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const bytes = new TextEncoder().encode(input);
  for (const b of bytes) {
    h1 ^= BigInt(b);
    h1 = (h1 * prime) & 0xffffffffffffffffn;
  }
  let s = h1.toString(16).padStart(16, "0");
  // Mix again to make 32 hex characters for visual richness
  let h2 = 0x84222325cbf29ce4n;
  for (const ch of s) {
    h2 ^= BigInt(ch.charCodeAt(0));
    h2 = (h2 * prime) & 0xffffffffffffffffn;
  }
  s += h2.toString(16).padStart(16, "0");
  return s;
}
