import { WsConnection } from '../ws/connection';
import { createMessage, type ServerEnvelope } from '../ws/protocol';
import type { ConnectionState, ChatMessage, Block, ActiveResponse } from './types';
import { saveMessages, loadMessages } from '../utils/storage';

class ChatStore {
  connectionState = $state<ConnectionState>('disconnected');
  clientId = $state('');
  serverVersion = $state('');
  messages = $state<ChatMessage[]>([]);
  activeResponse = $state<ActiveResponse | null>(null);
  isTyping = $state(false);

  private connection: WsConnection;
  private v1StreamId: string | null = null;

  private persist(): void {
    saveMessages(this.messages);
  }

  constructor() {
    this.messages = loadMessages();
    this.connection = new WsConnection();
    this.connection.onStateChange((state) => {
      this.connectionState = state;
    });
    this.connection.onEnvelope((env) => this.handleEnvelope(env));

  }

  connect(): void {
    this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
  }

  updateConnection(url: string, token?: string): void {
    this.connection = new WsConnection(url, token);
    this.connection.onStateChange((state) => {
      this.connectionState = state;
    });
    this.connection.onEnvelope((env) => this.handleEnvelope(env));
  }

  clearHistory(): void {
    this.messages = [];
    this.activeResponse = null;
    this.persist();
  }

  send(text: string): void {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      blocks: [],
      timestamp: new Date(),
    };
    this.messages = [...this.messages, userMsg];
    this.persist();
    const envelope = createMessage(text);
    this.connection.send(JSON.stringify(envelope));
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
    this.persist();
  }

  private handleError(id: string, code: string, content: string): void {
    const msg: ChatMessage = {
      id,
      role: 'assistant',
      content,
      blocks: [{
        id: crypto.randomUUID(),
        responseId: id,
        blockType: 'error',
        language: null,
        content,
        status: 'done',
        errorCode: code,
      }],
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
    if (this.activeResponse) return;

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

    if (chunk) {
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
    this.persist();
  }
}

export const chatStore = new ChatStore();
