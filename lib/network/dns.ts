export type DnsServerKind = "client" | "resolver" | "root" | "tld" | "authoritative";

export interface DnsHop {
  id: string;
  fromKind: DnsServerKind;
  toKind: DnsServerKind;
  type: "query" | "referral" | "answer";
  recordType: "A" | "NS" | "CNAME";
  payload: string;
  narration: string;
}

export interface DnsScenario {
  domain: string;
  finalIp: string;
  nodes: { kind: DnsServerKind; label: string; sub: string }[];
  hops: DnsHop[];
}

export function buildScenario(domain: string): DnsScenario {
  const labels = domain.split(".");
  const tld = labels[labels.length - 1] || "com";
  const apex = labels.slice(-2).join(".");
  const finalIp = "193.140.96.42";

  const nodes: DnsScenario["nodes"] = [
    { kind: "client", label: "Client", sub: "192.0.2.10" },
    { kind: "resolver", label: "Local resolver", sub: "8.8.8.8" },
    { kind: "root", label: "Root server", sub: "a.root-servers.net" },
    { kind: "tld", label: `${tld.toUpperCase()} TLD`, sub: `a.${tld}-servers.net` },
    { kind: "authoritative", label: "Authoritative", sub: `ns1.${apex}` },
  ];

  const hops: DnsHop[] = [
    {
      id: "client-to-resolver",
      fromKind: "client",
      toKind: "resolver",
      type: "query",
      recordType: "A",
      payload: `Q: ${domain} A?`,
      narration:
        "The application calls gethostbyname(); the OS forwards the query to the configured local resolver (often your ISP or 8.8.8.8).",
    },
    {
      id: "resolver-to-root",
      fromKind: "resolver",
      toKind: "root",
      type: "query",
      recordType: "A",
      payload: `Q: ${domain} A?`,
      narration:
        "The recursive resolver does not know the answer. It asks a root server, which is preconfigured in the resolver via the root hints file.",
    },
    {
      id: "root-to-resolver",
      fromKind: "root",
      toKind: "resolver",
      type: "referral",
      recordType: "NS",
      payload: `Refer: .${tld} servers`,
      narration:
        "Root doesn't know the IP either. It refers the resolver to the TLD servers responsible for the .${tld} zone.",
    },
    {
      id: "resolver-to-tld",
      fromKind: "resolver",
      toKind: "tld",
      type: "query",
      recordType: "A",
      payload: `Q: ${domain} A?`,
      narration: `The resolver asks the .${tld} TLD nameserver for ${domain}.`,
    },
    {
      id: "tld-to-resolver",
      fromKind: "tld",
      toKind: "resolver",
      type: "referral",
      recordType: "NS",
      payload: `Refer: ns1.${apex}`,
      narration: `The TLD doesn't know the IP either, but it knows who is authoritative for ${apex} — and refers the resolver there.`,
    },
    {
      id: "resolver-to-authoritative",
      fromKind: "resolver",
      toKind: "authoritative",
      type: "query",
      recordType: "A",
      payload: `Q: ${domain} A?`,
      narration: `The resolver finally asks the authoritative nameserver for ${apex}.`,
    },
    {
      id: "authoritative-to-resolver",
      fromKind: "authoritative",
      toKind: "resolver",
      type: "answer",
      recordType: "A",
      payload: `${domain} → ${finalIp}`,
      narration: `The authoritative server returns the A record. The resolver caches it for the TTL value.`,
    },
    {
      id: "resolver-to-client",
      fromKind: "resolver",
      toKind: "client",
      type: "answer",
      recordType: "A",
      payload: `${domain} → ${finalIp}`,
      narration: "The resolver returns the IP to the client; the application can now open a TCP connection.",
    },
  ];

  return { domain, finalIp, nodes, hops };
}

export const HOP_COLORS: Record<DnsHop["type"], string> = {
  query: "var(--color-primary)",
  referral: "var(--color-warn)",
  answer: "var(--color-accent)",
};
