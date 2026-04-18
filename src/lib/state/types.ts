export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type BlockType = 'text' | 'code' | 'thinking' | 'tool_call' | 'tool_result' | 'image' | 'error';

export type BlockStatus = 'streaming' | 'done';

export interface Block {
  id: string;
  responseId: string;
  blockType: BlockType;
  language: string | null;
  content: string;
  status: BlockStatus;
  imageUrl?: string;
  imageCaption?: string;
  errorCode?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks: Block[];
  timestamp: Date;
}

export interface ActiveResponse {
  id: string;
  replyTo: string;
  blocks: Map<string, Block>;
  blockOrder: string[];
  status: 'streaming' | 'done';
}
