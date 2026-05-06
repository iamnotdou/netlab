export type CategoryId =
  | "application"
  | "transport"
  | "network"
  | "link"
  | "security";

export interface QuizQuestion {
  id: string;
  category: CategoryId;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  application: "Application Layer",
  transport: "Transport Layer",
  network: "Network Layer",
  link: "Link Layer & LANs",
  security: "Cybersecurity & Cryptography",
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryId, string> = {
  application: "DNS, HTTP, SMTP, P2P, sockets, video streaming.",
  transport: "TCP, UDP, reliability, congestion control, flow control.",
  network: "IP, routing, forwarding, ICMP, NAT, IPv6, control plane.",
  link: "Ethernet, ARP, switches, wireless, error detection.",
  security: "Firewalls, TLS, symmetric/asymmetric crypto, hashing.",
};
