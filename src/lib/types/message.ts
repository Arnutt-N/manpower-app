export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string; // Which agent generated the message (if applicable)
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  toolCalls?: ToolCall[];
  retrievedDocs?: RetrievedDocument[];
  agent?: string;
  processingTime?: number;
  error?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  source: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface ConversationState {
  messages: Message[];
  sessionId: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}