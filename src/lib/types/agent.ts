import { Message } from './message';

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

export interface AgentResponse {
  agent: string;
  content: string;
  metadata?: {
    toolCalls?: string[];
    retrievedDocs?: number;
    processingTime?: number;
    error?: string;
  };
}

export interface RouterDecision {
  nextAgent: 'chat' | 'rag' | 'tools';
  confidence: number;
  reasoning: string;
}

export interface GraphState {
  messages: Message[];
  sessionId: string;
  userId?: string;
  nextAgent?: string;
  retrievedDocs?: RetrievedDocument[];
  toolResults?: ToolResult[];
}