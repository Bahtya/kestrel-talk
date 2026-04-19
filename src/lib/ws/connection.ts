import { parseEnvelope, createPing, type ServerEnvelope } from './protocol';
import { ReconnectStrategy } from './reconnect';
import type { ConnectionState } from '../state/types';

const PING_INTERVAL = 30000;
const CONNECT_TIMEOUT = 10000;
const MAX_QUEUE_SIZE = 100;
const DEFAULT_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8090';
const DEFAULT_TOKEN = import.meta.env.VITE_AUTH_TOKEN || undefined;

type EnvelopeHandler = (envelope: ServerEnvelope) => void;
type StateHandler = (state: ConnectionState) => void;

export class WsConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | undefined;
  private reconnect: ReconnectStrategy;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: string[] = [];
  private envelopeHandler: EnvelopeHandler | null = null;
  private stateHandler: StateHandler | null = null;
  private intentionalClose = false;

  constructor(url = DEFAULT_URL, token?: string) {
    this.url = url;
    this.token = token ?? DEFAULT_TOKEN;
    this.reconnect = new ReconnectStrategy();
  }

  private get connectionUrl(): string {
    if (!this.token) return this.url;
    try {
      const url = new URL(this.url);
      url.searchParams.set('token', this.token);
      return url.toString();
    } catch {
      return this.url;
    }
  }

  onEnvelope(handler: EnvelopeHandler): void {
    this.envelopeHandler = handler;
  }

  onStateChange(handler: StateHandler): void {
    this.stateHandler = handler;
  }

  connect(): void {
    // Clean up any existing connection to prevent stale onclose handlers
    if (this.ws) {
      this.intentionalClose = true;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.intentionalClose = false;
    this.reconnect.cancel();
    this.clearConnectTimeout();
    this.stopPing();
    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.connectionUrl);
      // @ts-expect-error test access
      if (typeof window !== 'undefined') window.__test_ws = this.ws;
    } catch {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }

    this.startConnectTimeout();

    this.ws.onopen = () => {
      this.clearConnectTimeout();
      this.reconnect.reset();
      this.setState('connected');
      if (this.token) {
        this.send(JSON.stringify({ type: 'auth', token: this.token }));
      }
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
      this.clearConnectTimeout();
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
    this.clearConnectTimeout();
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
      } catch {
        if (this.messageQueue.length < MAX_QUEUE_SIZE) {
          this.messageQueue.push(data);
        }
      }
    } else if (this.messageQueue.length < MAX_QUEUE_SIZE) {
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
      try {
        this.ws?.send(msg);
      } catch {
        break;
      }
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

  private startConnectTimeout(): void {
    this.clearConnectTimeout();
    this.connectTimer = setTimeout(() => {
      this.ws?.close();
      this.setState('error');
      this.scheduleReconnect();
    }, CONNECT_TIMEOUT);
  }

  private clearConnectTimeout(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }
}
