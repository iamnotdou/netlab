export type LayerKey = "application" | "transport" | "network" | "link" | "physical";

export interface LayerSpec {
  key: LayerKey;
  label: string;
  shortLabel: string;
  pdu: string;
  description: string;
  headerFields: { name: string; value: string; tooltip: string }[];
  colorVar: string;
}

export const LAYER_ORDER: LayerKey[] = [
  "application",
  "transport",
  "network",
  "link",
  "physical",
];

export interface SimulationInput {
  message: string;
  srcIp: string;
  dstIp: string;
  srcMac: string;
  dstMac: string;
  srcPort: number;
  dstPort: number;
}

export const DEFAULT_INPUT: SimulationInput = {
  message: "Hello, NetLab!",
  srcIp: "10.0.0.42",
  dstIp: "10.0.0.5",
  srcMac: "AA:BB:CC:11:22:33",
  dstMac: "DD:EE:FF:44:55:66",
  srcPort: 50432,
  dstPort: 80,
};

export function buildLayers(input: SimulationInput): LayerSpec[] {
  return [
    {
      key: "application",
      label: "Application",
      shortLabel: "APP",
      pdu: "Message",
      description:
        "Your data starts here. The application protocol (HTTP, SMTP, DNS…) decides how to format the bytes.",
      headerFields: [
        { name: "Protocol", value: "HTTP/1.1", tooltip: "Protocol used by the application." },
        {
          name: "Method",
          value: "GET /index",
          tooltip: "The HTTP method and path. Application-defined.",
        },
        {
          name: "Payload",
          value: input.message,
          tooltip: "The literal bytes you want delivered to the peer.",
        },
      ],
      colorVar: "var(--color-layer-app)",
    },
    {
      key: "transport",
      label: "Transport",
      shortLabel: "TCP",
      pdu: "Segment",
      description:
        "Transport adds ports so the receiver knows which process to deliver to, plus reliability features (sequence numbers, ACKs).",
      headerFields: [
        {
          name: "Source Port",
          value: String(input.srcPort),
          tooltip: "An ephemeral port chosen by your OS for this connection.",
        },
        {
          name: "Destination Port",
          value: String(input.dstPort),
          tooltip: "Well-known port of the server (80 = HTTP, 443 = HTTPS).",
        },
        {
          name: "Sequence #",
          value: "1",
          tooltip: "Used by TCP to reorder segments and detect missing data.",
        },
        {
          name: "Flags",
          value: "PSH, ACK",
          tooltip: "Control flags. PSH = push immediately, ACK = acknowledging prior data.",
        },
      ],
      colorVar: "var(--color-layer-transport)",
    },
    {
      key: "network",
      label: "Network",
      shortLabel: "IP",
      pdu: "Packet",
      description:
        "Network adds source and destination IPs so routers can forward this packet across the internetwork.",
      headerFields: [
        {
          name: "Source IP",
          value: input.srcIp,
          tooltip: "Logical address of the sender. Used by routers for return path.",
        },
        {
          name: "Destination IP",
          value: input.dstIp,
          tooltip: "Logical address of the receiver. Routed hop-by-hop.",
        },
        {
          name: "TTL",
          value: "64",
          tooltip:
            "Time-to-live. Each router decrements by 1; if it hits 0 the packet is dropped (loop protection).",
        },
        {
          name: "Protocol",
          value: "6 (TCP)",
          tooltip: "Tells the receiver which transport-layer protocol the payload belongs to.",
        },
      ],
      colorVar: "var(--color-layer-network)",
    },
    {
      key: "link",
      label: "Link",
      shortLabel: "ETH",
      pdu: "Frame",
      description:
        "The link layer wraps the packet in a frame addressed to the next hop's MAC address (resolved via ARP).",
      headerFields: [
        {
          name: "Source MAC",
          value: input.srcMac,
          tooltip: "Hardware address of the sending NIC. Globally unique (mostly).",
        },
        {
          name: "Destination MAC",
          value: input.dstMac,
          tooltip:
            "Hardware address of the next hop — the default gateway for off-LAN destinations.",
        },
        { name: "EtherType", value: "0x0800", tooltip: "0x0800 means the payload is IPv4." },
        {
          name: "FCS",
          value: "CRC-32",
          tooltip: "Frame check sequence — detects bit errors caused by the physical medium.",
        },
      ],
      colorVar: "var(--color-layer-link)",
    },
    {
      key: "physical",
      label: "Physical",
      shortLabel: "PHY",
      pdu: "Bits",
      description:
        "The physical layer encodes the frame as electrical, optical, or radio signals over the medium.",
      headerFields: [
        {
          name: "Encoding",
          value: "Manchester",
          tooltip: "Self-clocking line code used over twisted pair / coaxial Ethernet links.",
        },
        {
          name: "Medium",
          value: "Cat 6 cable",
          tooltip: "Physical medium carrying the bits between two NICs.",
        },
      ],
      colorVar: "var(--color-layer-physical)",
    },
  ];
}

export type Phase =
  | { kind: "idle" }
  | { kind: "encapsulating"; layerIndex: number }
  | { kind: "traveling" }
  | { kind: "decapsulating"; layerIndex: number }
  | { kind: "delivered" };

export const PHASE_DESCRIPTIONS: Record<string, string> = {
  idle: "Press Send to launch the packet through the stack.",
  "encap-application": "Application creates the message payload — no headers added yet.",
  "encap-transport":
    "Transport (TCP) wraps the message with port numbers and sequence info — now it's a segment.",
  "encap-network":
    "Network (IP) prepends source/destination IP and TTL — now it's a packet, ready to route.",
  "encap-link":
    "Link layer (Ethernet) wraps the packet in a frame with MAC addresses for the next hop.",
  "encap-physical":
    "Physical layer encodes the frame into bits on the wire — voltage, light, or radio.",
  traveling:
    "Bits flow across the medium, hop through routers, and arrive at the destination NIC.",
  "decap-physical": "Receiver's NIC decodes the bits back into a frame.",
  "decap-link":
    "Link layer checks the FCS, verifies the destination MAC matches, and strips the Ethernet header.",
  "decap-network":
    "Network layer checks the destination IP, decrements TTL, and hands off to the transport layer.",
  "decap-transport":
    "Transport layer reassembles segments by sequence number and delivers to the right port.",
  "decap-application":
    "Application receives the original message — bytes for byte, the same as what we sent.",
  delivered: "The peer reads your message. Encapsulation/decapsulation is symmetric and lossless.",
};
