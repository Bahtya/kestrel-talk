import { WsConnection } from '../ws/connection';
import { createMessage, type ServerEnvelope } from '../ws/protocol';
import type { ConnectionState, ChatMessage, Block, ActiveResponse } from './types';
import { saveMessages, loadMessages, showToast } from '../utils/storage';
import { playNotification, playSend } from '../utils/notify';
import { showNotification } from '../utils/browser-notify';

export class ChatStore {
  connectionState = $state<ConnectionState>('disconnected');
  reconnectAttempt = $state(0);
  lastError = $state('');
  clientId = $state('');
  serverVersion = $state('');
  messages = $state<ChatMessage[]>([]);
  activeResponse = $state<ActiveResponse | null>(null);
  isTyping = $state(false);

  private connection: WsConnection;
  private wasConnected = false;
  private v1StreamId: string | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  private persist(): void {
    saveMessages(this.messages);
  }

  constructor() {
    this.messages = loadMessages();
    this.connection = this.createConnection();
  }

  private createConnection(url?: string, token?: string): WsConnection {
    const conn = new WsConnection(url, token);
    conn.onStateChange((state) => this.handleStateChange(state));
    conn.onEnvelope((env) => this.handleEnvelope(env));
    return conn;
  }

  private handleStateChange(state: ConnectionState): void {
    this.connectionState = state;
    if (state === 'connected') {
      this.reconnectAttempt = 0;
      this.lastError = '';
      if (!this.wasConnected) {
        showToast('Connected to kestrel-agent', 'success');
        this.wasConnected = true;
      }
    } else if (state === 'disconnected' || state === 'error') {
      this.reconnectAttempt++;
      if (state === 'error') this.lastError = 'Connection failed';
      this.savePartialResponse();
      this.isTyping = false;
      this.clearTypingTimer();
    }
  }

  connect(): void {
    this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
  }

  updateConnection(url: string, token?: string): void {
    this.connection = this.createConnection(url, token);
  }

  savePartialResponse(): void {
    this.v1StreamId = null;
    if (!this.activeResponse) return;
    const blocks = Array.from(this.activeResponse.blocks.values());
    if (blocks.some((b) => b.content.length > 0)) {
      const content = blocks.map((b) => b.content).join('\n');
      const msg: ChatMessage = {
        id: this.activeResponse.id,
        role: 'assistant',
        content,
        blocks,
        timestamp: new Date(),
      };
      this.messages = [...this.messages, msg];
      this.activeResponse = null;
      this.persist();
    }
  }

  clearHistory(): void {
    this.messages = [];
    this.activeResponse = null;
    this.persist();
  }

  addSystemMessage(content: string): void {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      blocks: [{
        id: crypto.randomUUID(),
        responseId: '',
        blockType: 'text',
        language: null,
        content,
        status: 'done',
      }],
      timestamp: new Date(),
    };
    this.messages = [...this.messages, msg];
    this.persist();
  }

  retry(messageId: string): void {
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    for (let i = idx - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        const text = this.messages[i].content;
        this.messages = this.messages.slice(0, i);
        this.persist();
        this.send(text);
        return;
      }
    }
    showToast('No user message found to retry', 'error');
  }

  send(text: string): void {
    if (this.connectionState !== 'connected') {
      showToast('Not connected — please wait', 'error');
      return;
    }
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      blocks: [],
      timestamp: new Date(),
    };
    this.messages = [...this.messages, userMsg];
    this.persist();
    playSend();
    const envelope = createMessage(text);
    const sent = this.connection.send(JSON.stringify(envelope));
    if (!sent) {
      showToast('Message queue full — please wait', 'error');
    }
  }

  private handleEnvelope(env: ServerEnvelope): void {
    switch (env.type) {
      case 'welcome':
        this.clientId = env.client_id;
        this.serverVersion = env.server_version;
        break;

      case 'message':
        this.handleCompleteMessage(env.id, env.content);
        break;

      case 'streaming':
        this.handleV1Streaming(env.id, env.chunk, env.done);
        break;

      case 'response_start':
        this.handleResponseStart(env.id, env.reply_to);
        break;

      case 'block_start':
        this.handleBlockStart(env.id, env.response_id, env.block_type, env.language ?? null);
        break;

      case 'block_delta':
        this.handleBlockDelta(env.id, env.response_id, env.content);
        break;

      case 'block_end':
        this.handleBlockEnd(env.id, env.response_id);
        break;

      case 'response_end':
        this.handleResponseEnd(env.id);
        break;

      case 'typing':
        this.isTyping = true;
        this.resetTypingTimer();
        break;

      case 'error':
        this.handleError(env.id, env.code, env.content ?? 'Unknown error');
        break;

      case 'pong':
        break;

      case 'image':
        this.handleImage(env.id, env.url, env.caption);
        break;
    }
  }

  // --- v2 block-level handlers ---

  private handleResponseStart(id: string, replyTo?: string): void {
    this.activeResponse = {
      id,
      replyTo: replyTo ?? '',
      blocks: new Map(),
      blockOrder: [],
      status: 'streaming',
    };
  }

  private handleBlockStart(blockId: string, responseId: string, blockType: Block['blockType'], language: string | null): void {
    if (!this.activeResponse || this.activeResponse.id !== responseId) return;
    if (this.activeResponse.blocks.has(blockId)) return;

    const block: Block = {
      id: blockId,
      responseId,
      blockType,
      language,
      content: '',
      status: 'streaming',
    };

    const blocks = new Map(this.activeResponse.blocks);
    blocks.set(blockId, block);

    this.activeResponse = {
      ...this.activeResponse,
      blocks,
      blockOrder: [...this.activeResponse.blockOrder, blockId],
    };
  }

  private handleBlockDelta(blockId: string, responseId: string, content: string): void {
    if (!this.activeResponse || this.activeResponse.id !== responseId) return;

    const blocks = new Map(this.activeResponse.blocks);
    const block = blocks.get(blockId);
    if (!block) return;

    blocks.set(blockId, { ...block, content: block.content + content });
    this.activeResponse = { ...this.activeResponse, blocks };
  }

  private handleBlockEnd(blockId: string, responseId: string): void {
    if (!this.activeResponse || this.activeResponse.id !== responseId) return;

    const blocks = new Map(this.activeResponse.blocks);
    const block = blocks.get(blockId);
    if (!block) return;

    blocks.set(blockId, { ...block, status: 'done' });
    this.activeResponse = { ...this.activeResponse, blocks };
  }

  private handleResponseEnd(id: string): void {
    if (!this.activeResponse || this.activeResponse.id !== id) return;

    const blocks = Array.from(this.activeResponse.blocks.values());
    const content = blocks.map((b) => b.content).join('\n');

    const msg: ChatMessage = {
      id: this.activeResponse.id,
      role: 'assistant',
      content,
      blocks,
      timestamp: new Date(),
    };

    this.messages = [...this.messages, msg];
    this.activeResponse = null;
    this.isTyping = false;
    this.clearTypingTimer();
    this.persist();
    playNotification();
    showNotification('kestrel-agent', msg.content.slice(0, 100));
  }

  private handleError(id: string, code: string, content: string): void {
    this.lastError = `${code}: ${content}`;
    // Preserve any partial blocks streamed before the error
    const priorBlocks = this.activeResponse?.id === id
      ? Array.from(this.activeResponse.blocks.values()).filter((b) => b.content.length > 0)
      : [];
    if (this.activeResponse?.id === id) {
      this.activeResponse = null;
    }
    const errorBlock: Block = {
      id: crypto.randomUUID(),
      responseId: id,
      blockType: 'error',
      language: null,
      content,
      status: 'done',
      errorCode: code,
    };
    const allBlocks = [...priorBlocks, errorBlock];
    const fullContent = allBlocks.map((b) => b.content).join('\n');
    const msg: ChatMessage = {
      id,
      role: 'assistant',
      content: fullContent,
      blocks: allBlocks,
      timestamp: new Date(),
    };
    this.messages = [...this.messages, msg];
    this.isTyping = false;
    this.persist();
  }

  private handleImage(id: string, url: string, caption?: string): void {
    const msg: ChatMessage = {
      id,
      role: 'assistant',
      content: caption ?? '',
      blocks: [{
        id: crypto.randomUUID(),
        responseId: id,
        blockType: 'image',
        language: null,
        content: '',
        status: 'done',
        imageUrl: url,
        imageCaption: caption,
      }],
      timestamp: new Date(),
    };
    this.messages = [...this.messages, msg];
    this.isTyping = false;
    this.persist();
  }

  // --- v1 simple streaming compat ---

  private handleV1Streaming(id: string, chunk: string, done: boolean): void {
    // Skip if there's an active v2 response
    if (this.activeResponse && !this.v1StreamId) return;

    if (!this.v1StreamId) {
      this.v1StreamId = id;
      const blockId = crypto.randomUUID();
      this.activeResponse = {
        id,
        replyTo: '',
        blocks: new Map([[blockId, {
          id: blockId,
          responseId: id,
          blockType: 'text' as const,
          language: null,
          content: '',
          status: 'streaming' as const,
        }]]),
        blockOrder: [blockId],
        status: 'streaming',
      };
    }

    if (chunk && this.activeResponse) {
      const blocks = new Map(this.activeResponse.blocks);
      const block = blocks.values().next().value;
      if (block) {
        blocks.set(block.id, { ...block, content: block.content + chunk });
        this.activeResponse = { ...this.activeResponse, blocks };
      }
    }

    if (done) {
      this.handleResponseEnd(id);
      this.v1StreamId = null;
    }
  }

  private handleCompleteMessage(id: string, content: string): void {
    const msg: ChatMessage = {
      id,
      role: 'assistant',
      content,
      blocks: [{
        id: crypto.randomUUID(),
        responseId: id,
        blockType: 'text',
        language: null,
        content,
        status: 'done',
      }],
      timestamp: new Date(),
    };
    this.messages = [...this.messages, msg];
    this.isTyping = false;
    this.clearTypingTimer();
    this.persist();
    playNotification();
  }

  private resetTypingTimer(): void {
    this.clearTypingTimer();
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
    }, 15000);
  }

  private clearTypingTimer(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }
}

export const chatStore = new ChatStore();
