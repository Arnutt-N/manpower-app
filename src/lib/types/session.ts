import { Message, ConversationState } from './message';

export interface Session {
  sessionId: string;
  userId?: string;
  state: AgentState;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentState {
  messages: Message[];
  sessionId: string;
  userId?: string;
  nextAgent?: 'chat' | 'rag' | 'tools';
  retrievedDocs?: RetrievedDocument[];
  toolResults?: ToolResult[];
  context?: Record<string, any>;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  source: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  toolName: string;
  result: any;
  error?: string;
  timestamp: Date;
}

export interface SessionStorage {
  saveSession(sessionId: string, state: AgentState): Promise<void>;
  loadSession(sessionId: string): Promise<AgentState | null>;
  deleteSession(sessionId: string): Promise<void>;
  listSessions(userId?: string): Promise<string[]>;
}