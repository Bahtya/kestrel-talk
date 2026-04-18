import { parseEnvelope, createPing, type ServerEnvelope } from './protocol';
import { ReconnectStrategy } from './reconnect';
import type { ConnectionState } from '../state/types';

const PING_INTERVAL = 30000;
const DEFAULT_URL = 'ws://127.0.0.1:8090';

type EnvelopeHandler = (envelope: ServerEnvelope) => void;
type StateHandler = (state: ConnectionState) => void;

export class WsConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnect: ReconnectStrategy;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: string[] = [];
  private envelopeHandler: EnvelopeHandler | null = null;
  private stateHandler: StateHandler | null = null;
  private intentionalClose = false;

  constructor(url = DEFAULT_URL) {
    this.url = url;
    this.reconnect = new ReconnectStrategy();
  }

  onEnvelope(handler: EnvelopeHandler): void {
    this.envelopeHandler = handler;
  }

  onStateChange(handler: StateHandler): void {
    this.stateHandler = handler;
  }

  connect(): void {
    this.intentionalClose = false;
    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnect.reset();
      this.setState('connected');
      this.flushQueue();
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      const envelope = parseEnvelope(event.data);
      if (envelope) {
        this.envelopeHandler?.(envelope);
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.ws = null;
      if (!this.intentionalClose) {
        this.setState('disconnected');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.setState('error');
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.reconnect.cancel();
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.messageQueue.push(data);
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private setState(state: ConnectionState): void {
    this.stateHandler?.(state);
  }

  private scheduleReconnect(): void {
    this.reconnect.schedule(() => this.connect());
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.ws?.send(msg);
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send(JSON.stringify(createPing()));
    }, PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
