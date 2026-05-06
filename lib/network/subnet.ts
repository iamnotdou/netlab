export interface SubnetCalculation {
  ip: string;
  prefix: number;
  ipBits: number[]; // 32 bits, MSB first
  maskBits: number[];
  network: string;
  broadcast: string;
  firstUsable: string | null;
  lastUsable: string | null;
  totalAddresses: number;
  usableHosts: number;
  hostBits: number;
  networkBits: number;
}

export function ipToOctets(ip: string): number[] | null {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4) return null;
  if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return parts;
}

export function ipToBits(ip: string): number[] | null {
  const oct = ipToOctets(ip);
  if (!oct) return null;
  const bits: number[] = [];
  for (const o of oct) {
    for (let i = 7; i >= 0; i--) bits.push((o >> i) & 1);
  }
  return bits;
}

export function bitsToIp(bits: number[]): string {
  const octets: number[] = [];
  for (let i = 0; i < 32; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    octets.push(v);
  }
  return octets.join(".");
}

export function calculate(ip: string, prefix: number): SubnetCalculation | null {
  const ipBits = ipToBits(ip);
  if (!ipBits || prefix < 0 || prefix > 32) return null;

  const maskBits = Array.from({ length: 32 }, (_, i) => (i < prefix ? 1 : 0));
  const networkBitsArr = ipBits.map((b, i) => b & maskBits[i]);
  const broadcastBitsArr = ipBits.map((b, i) => (i < prefix ? networkBitsArr[i] : 1));

  const totalAddresses = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
  const usableHosts =
    prefix >= 31 ? (prefix === 32 ? 0 : 2) : Math.max(0, totalAddresses - 2);

  const networkIp = bitsToIp(networkBitsArr);
  const broadcastIp = bitsToIp(broadcastBitsArr);

  let firstUsable: string | null = null;
  let lastUsable: string | null = null;
  if (prefix < 31) {
    const firstBits = [...networkBitsArr];
    firstBits[31] = 1;
    const lastBits = [...broadcastBitsArr];
    lastBits[31] = 0;
    firstUsable = bitsToIp(firstBits);
    lastUsable = bitsToIp(lastBits);
  }

  return {
    ip,
    prefix,
    ipBits,
    maskBits,
    network: networkIp,
    broadcast: broadcastIp,
    firstUsable,
    lastUsable,
    totalAddresses,
    usableHosts,
    hostBits: 32 - prefix,
    networkBits: prefix,
  };
}

export interface DrillQuestion {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  data: { ip: string; prefix: number };
}

function rndOct() {
  return Math.floor(Math.random() * 255) + 1;
}

function rndPrefix() {
  return 16 + Math.floor(Math.random() * 14); // 16..29
}

export function generateDrill(seed: number): DrillQuestion[] {
  let n = seed;
  const rng = () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
  const make = (i: number): DrillQuestion => {
    const ip = `${1 + Math.floor(rng() * 222)}.${Math.floor(rng() * 255)}.${Math.floor(
      rng() * 255,
    )}.${Math.floor(rng() * 255)}`;
    const prefix = 16 + Math.floor(rng() * 14);
    const calc = calculate(ip, prefix)!;
    const variant = i % 3;
    if (variant === 0) {
      return {
        id: `q-${i}`,
        prompt: `What is the network address for ${ip}/${prefix}?`,
        answer: calc.network,
        hint: "AND the IP with the mask, bit by bit. Bits to the right of the mask boundary become 0.",
        data: { ip, prefix },
      };
    }
    if (variant === 1) {
      return {
        id: `q-${i}`,
        prompt: `How many usable hosts are in ${ip}/${prefix}?`,
        answer: String(calc.usableHosts),
        hint: "2^(32 - prefix) - 2, except for /31 and /32 which have special rules.",
        data: { ip, prefix },
      };
    }
    return {
      id: `q-${i}`,
      prompt: `What is the broadcast address for ${ip}/${prefix}?`,
      answer: calc.broadcast,
      hint: "Same as network, but every host bit flipped to 1.",
      data: { ip, prefix },
    };
  };
  return Array.from({ length: 8 }, (_, i) => make(i));
}

export const _internal = { rndOct, rndPrefix };
