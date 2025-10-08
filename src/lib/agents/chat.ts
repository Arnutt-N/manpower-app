/**
 * Chat Agent - Handles general conversational interactions
 */

import { getGLMClient } from '@/lib/llm/glm';
import { AgentState, AgentResponse } from '@/lib/types/agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export class ChatAgent {
  private glmClient = getGLMClient();

  /**
   * Process a message and generate a response
   */
  async processMessage(state: AgentState): Promise<AgentResponse> {
    if (!state.messages || state.messages.length === 0) {
      throw new Error('No message to process');
    }

    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent = this.extractMessageContent(lastMessage);

    if (!messageContent) {
      throw new Error('No message content found');
    }

    try {
      const systemPrompt = this.generateSystemPrompt(state);
      const response = await this.glmClient.generateCompletion(messageContent, {
        systemPrompt,
      });

      return {
        agent: 'chat',
        content: response,
        metadata: {
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      console.error('ChatAgent processing error:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * Stream a response for real-time chat
   */
  async* streamMessage(state: AgentState): AsyncGenerator<string, void, unknown> {
    if (!state.messages || state.messages.length === 0) {
      throw new Error('No message to process');
    }

    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent = this.extractMessageContent(lastMessage);

    if (!messageContent) {
      throw new Error('No message content found');
    }

    try {
      const systemPrompt = this.generateSystemPrompt(state);
      const stream = this.glmClient.streamCompletion(messageContent, {
        systemPrompt,
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('ChatAgent streaming error:', error);
      throw new Error('Failed to stream message');
    }
  }

  /**
   * Generate appropriate system prompt based on context
   */
  generateSystemPrompt(state?: AgentState): string {
    let prompt = `You are a helpful, friendly, and conversational AI assistant. You should:

1. Be natural and engaging in conversations
2. Provide helpful and accurate information
3. Be concise but thorough
4. If you don't know something, admit it gracefully
5. Maintain a positive and professional tone
6. Focus on being helpful and conversational

Respond in a way that feels like a natural conversation.`;

    // Adapt prompt based on conversation context
    if (state && state.messages.length > 1) {
      prompt += `\n\nYou are in the middle of a conversation. Consider the previous context when responding, but focus on answering the most recent message.`;
    }

    return prompt;
  }

  /**
   * Extract text content from a message object
   */
  private extractMessageContent(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message && typeof message === 'object') {
      if (message.content) {
        return typeof message.content === 'string' ? message.content : String(message.content);
      }

      if (message.text) {
        return typeof message.text === 'string' ? message.text : String(message.text);
      }
    }

    return '';
  }

  /**
   * Check if this agent should handle the given message
   */
  shouldHandle(state: AgentState): boolean {
    if (!state.messages || state.messages.length === 0) {
      return false;
    }

    const lastMessage = state.messages[state.messages.length - 1];
    const content = this.extractMessageContent(lastMessage);

    // Basic heuristic for conversational queries
    const conversationalPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
      /^(how are you|how do you do|what's up|sup)/i,
      /^(thank you|thanks|appreciate|grateful)/i,
      /^(bye|goodbye|see you|farewell)/i,
      /^(help|can you|could you|would you)/i,
      /^(what|who|where|when|why|how)/i,
      /^(tell me|explain|describe)/i,
    ];

    return conversationalPatterns.some(pattern => pattern.test(content.trim()));
  }
}