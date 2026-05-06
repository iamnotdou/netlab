import {
  Boxes,
  Handshake,
  Search,
  Network as NetworkIcon,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export type ModuleAccent = "primary" | "transport" | "network" | "link" | "accent";

export interface NetlabModule {
  slug: string;
  title: string;
  href: string;
  tagline: string;
  description: string;
  chapter: string;
  topics: string[];
  icon: LucideIcon;
  accent: ModuleAccent;
}

export const MODULES: NetlabModule[] = [
  {
    slug: "packet-journey",
    title: "Packet Journey",
    href: "/lab/packet-journey",
    tagline: "5-layer encapsulation, animated.",
    description:
      "Watch a single message travel down the protocol stack — application, transport, network, link, physical — and back up at the destination, with every header explained.",
    chapter: "Ch. 1–6",
    topics: ["Encapsulation", "Headers", "OSI / TCP-IP", "Frames"],
    icon: Boxes,
    accent: "primary",
  },
  {
    slug: "tcp-handshake",
    title: "TCP Handshake Lab",
    href: "/lab/tcp-handshake",
    tagline: "SYN, SYN-ACK, ACK — visualized.",
    description:
      "Step through the three-way handshake in lockstep with the TCP state machine. Trigger packet loss and watch retransmission save the day.",
    chapter: "Ch. 3",
    topics: ["TCP", "State Machine", "Reliability"],
    icon: Handshake,
    accent: "transport",
  },
  {
    slug: "dns-detective",
    title: "DNS Detective",
    href: "/lab/dns-detective",
    tagline: "Trace recursive resolution end-to-end.",
    description:
      "Type any domain and watch the recursive resolver walk through root, TLD, and authoritative servers — animated edges, real records, full transparency.",
    chapter: "Ch. 2",
    topics: ["DNS", "Resolvers", "Caching"],
    icon: Search,
    accent: "accent",
  },
  {
    slug: "subnet-trainer",
    title: "Subnet Trainer",
    href: "/lab/subnet-trainer",
    tagline: "CIDR math you can finally see.",
    description:
      "Slide the CIDR mask, watch network and host bits light up. Drill mode hands you 50 timed questions with adaptive difficulty.",
    chapter: "Ch. 4",
    topics: ["IPv4", "CIDR", "Masking", "Drill"],
    icon: NetworkIcon,
    accent: "network",
  },
  {
    slug: "crypto-playground",
    title: "Crypto Playground",
    href: "/lab/crypto-playground",
    tagline: "Caesar, Vigenère, RSA — hands-on.",
    description:
      "Encrypt characters in real time. Step through RSA key generation with tiny primes. Compare hashes and feel why one bit avalanches.",
    chapter: "Ch. 8",
    topics: ["Caesar", "Vigenère", "RSA", "Hashing"],
    icon: KeyRound,
    accent: "link",
  },
];

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}

export const ACCENT_CLASSES: Record<ModuleAccent, { ring: string; text: string; bg: string }> =
  {
    primary: { ring: "ring-primary/40", text: "text-primary", bg: "bg-primary/10" },
    transport: {
      ring: "ring-layer-transport/40",
      text: "text-layer-transport",
      bg: "bg-layer-transport/10",
    },
    network: {
      ring: "ring-layer-network/40",
      text: "text-layer-network",
      bg: "bg-layer-network/10",
    },
    link: {
      ring: "ring-layer-link/40",
      text: "text-layer-link",
      bg: "bg-layer-link/10",
    },
    accent: { ring: "ring-accent/40", text: "text-accent", bg: "bg-accent/10" },
  };
