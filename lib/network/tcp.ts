export type TcpState =
  | "CLOSED"
  | "LISTEN"
  | "SYN_SENT"
  | "SYN_RECEIVED"
  | "ESTABLISHED";

export const CLIENT_STATES: TcpState[] = ["CLOSED", "SYN_SENT", "ESTABLISHED"];
export const SERVER_STATES: TcpState[] = ["LISTEN", "SYN_RECEIVED", "ESTABLISHED"];

export interface TcpStep {
  id: string;
  flightTime: number;
  segment: {
    flags: string;
    seq: number;
    ack: number | null;
    description: string;
  };
  direction: "client-to-server" | "server-to-client";
  clientState: TcpState;
  serverState: TcpState;
  narration: string;
  bullet: string;
}

export const HANDSHAKE_STEPS: TcpStep[] = [
  {
    id: "syn",
    flightTime: 1.4,
    segment: {
      flags: "SYN",
      seq: 1000,
      ack: null,
      description: "Client opens the connection by sending SYN with its initial sequence number.",
    },
    direction: "client-to-server",
    clientState: "SYN_SENT",
    serverState: "LISTEN",
    narration:
      "Client picks an initial sequence number (ISN = 1000) and sends a SYN segment. It transitions from CLOSED to SYN_SENT.",
    bullet: "Client → Server  ·  SYN, seq=1000",
  },
  {
    id: "syn-ack",
    flightTime: 1.4,
    segment: {
      flags: "SYN, ACK",
      seq: 5000,
      ack: 1001,
      description:
        "Server replies with its own SYN (its ISN) and acknowledges the client's SYN by setting ack = client_seq + 1.",
    },
    direction: "server-to-client",
    clientState: "SYN_SENT",
    serverState: "SYN_RECEIVED",
    narration:
      "Server moves from LISTEN to SYN_RECEIVED. It sends SYN+ACK with its own ISN (5000) and acks the client's SYN with ack=1001.",
    bullet: "Server → Client  ·  SYN+ACK, seq=5000, ack=1001",
  },
  {
    id: "ack",
    flightTime: 1.2,
    segment: {
      flags: "ACK",
      seq: 1001,
      ack: 5001,
      description:
        "Client confirms with a final ACK. Both sides are now ESTABLISHED — data can flow.",
    },
    direction: "client-to-server",
    clientState: "ESTABLISHED",
    serverState: "ESTABLISHED",
    narration:
      "Client sends a final ACK (ack=5001) and moves to ESTABLISHED. Once the server receives it, it also moves to ESTABLISHED. The connection is open.",
    bullet: "Client → Server  ·  ACK, seq=1001, ack=5001",
  },
];

export const STATE_DESCRIPTIONS: Record<TcpState, string> = {
  CLOSED: "No connection. Default state before connect() / before listen().",
  LISTEN: "Server is waiting for incoming SYN segments on a specific port.",
  SYN_SENT: "Client has sent SYN and is waiting for SYN+ACK.",
  SYN_RECEIVED: "Server has received SYN and replied with SYN+ACK; awaiting final ACK.",
  ESTABLISHED: "Both sides agreed on initial sequence numbers; data can flow in both directions.",
};
