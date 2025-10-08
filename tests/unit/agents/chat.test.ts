/**
 * Unit tests for Chat Agent
 * RED PHASE: These tests should FAIL initially
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatAgent } from '@/lib/agents/chat';
import { AgentState } from '@/lib/types/agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Mock the GLM client
vi.mock('@/lib/llm/glm', () => ({
  getGLMClient: vi.fn(() => ({
    generateCompletion: vi.fn(),
    streamCompletion: vi.fn(),
  })),
}));

describe('ChatAgent', () => {
  let chatAgent: ChatAgent;
  let mockGLMClient: any;

  beforeEach(() => {
    const { getGLMClient } = require('@/lib/llm/glm');
    mockGLMClient = getGLMClient();
    chatAgent = new ChatAgent();
  });

  describe('processMessage', () => {
    it('should process a simple greeting message', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello, how are you?')],
        sessionId: 'test-session',
      };

      const expectedResponse = 'Hello! I am doing well, thank you for asking. How can I help you today?';
      mockGLMClient.generateCompletion.mockResolvedValue(expectedResponse);

      // Act
      const result = await chatAgent.processMessage(state);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe(expectedResponse);
      expect(result.agent).toBe('chat');
      expect(mockGLMClient.generateCompletion).toHaveBeenCalledWith('Hello, how are you?');
    });

    it('should handle conversation context with previous messages', async () => {
      // Arrange
      const state: AgentState = {
        messages: [
          new HumanMessage('What is TypeScript?'),
          new AIMessage('TypeScript is a typed superset of JavaScript.'),
          new HumanMessage('Can you give me an example?'),
        ],
        sessionId: 'test-session',
      };

      const expectedResponse = 'Sure! Here\'s a TypeScript example...';
      mockGLMClient.generateCompletion.mockResolvedValue(expectedResponse);

      // Act
      const result = await chatAgent.processMessage(state);

      // Assert
      expect(result.content).toBe(expectedResponse);
      expect(mockGLMClient.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Can you give me an example?')
      );
    });

    it('should handle empty message gracefully', async () => {
      // Arrange
      const state: AgentState = {
        messages: [],
        sessionId: 'test-session',
      };

      // Act & Assert
      await expect(chatAgent.processMessage(state)).rejects.toThrow('No message to process');
    });

    it('should handle GLM API errors gracefully', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello')],
        sessionId: 'test-session',
      };

      mockGLMClient.generateCompletion.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(chatAgent.processMessage(state)).rejects.toThrow('Failed to process message');
    });
  });

  describe('streamMessage', () => {
    it('should stream a response token by token', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Tell me a joke')],
        sessionId: 'test-session',
      };

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Why' };
          yield { content: ' did' };
          yield { content: ' the' };
          yield { content: ' chicken' };
          yield { content: ' cross' };
          yield { content: ' the' };
          yield { content: ' road?' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);

      // Act
      const stream = chatAgent.streamMessage(state);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Assert
      expect(chunks).toEqual(['Why', ' did', ' the', ' chicken', ' cross', ' the', ' road?']);
      expect(mockGLMClient.streamCompletion).toHaveBeenCalledWith('Tell me a joke');
    });

    it('should handle streaming errors', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello')],
        sessionId: 'test-session',
      };

      mockGLMClient.streamCompletion.mockRejectedValue(new Error('Streaming error'));

      // Act & Assert
      const stream = chatAgent.streamMessage(state);
      await expect(stream.next()).rejects.toThrow('Streaming error');
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate appropriate system prompt', () => {
      // Act
      const prompt = chatAgent.generateSystemPrompt();

      // Assert
      expect(prompt).toContain('helpful assistant');
      expect(prompt).toContain('friendly');
      expect(prompt).toContain('conversational');
    });

    it('should customize system prompt based on context', () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Help me with code')],
        sessionId: 'test-session',
      };

      // Act
      const prompt = chatAgent.generateSystemPrompt(state);

      // Assert
      expect(prompt).toContain('helpful assistant');
      // Should potentially adapt based on message content
    });
  });
});