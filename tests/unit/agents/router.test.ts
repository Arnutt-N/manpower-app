/**
 * Unit tests for Router Agent
 * RED PHASE: These tests should FAIL initially
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouterAgent } from '@/lib/agents/router';
import { AgentState, RouterDecision } from '@/lib/types/agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Mock the GLM client
vi.mock('@/lib/llm/glm', () => ({
  getGLMClient: vi.fn(() => ({
    generateCompletion: vi.fn(),
  })),
}));

describe('RouterAgent', () => {
  let routerAgent: RouterAgent;
  let mockGLMClient: any;

  beforeEach(() => {
    const { getGLMClient } = require('@/lib/llm/glm');
    mockGLMClient = getGLMClient();
    routerAgent = new RouterAgent();
  });

  describe('routeMessage', () => {
    it('should route general conversation to chat agent', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello, how are you today?')],
        sessionId: 'test-session',
      };

      const mockDecision: RouterDecision = {
        nextAgent: 'chat',
        confidence: 0.95,
        reasoning: 'This is a general conversational query',
      };

      mockGLMClient.generateCompletion.mockResolvedValue(JSON.stringify(mockDecision));

      // Act
      const result = await routerAgent.routeMessage(state);

      // Assert
      expect(result.nextAgent).toBe('chat');
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toContain('general conversational');
    });

    it('should route knowledge-based questions to RAG agent', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('What are the key features of this project?')],
        sessionId: 'test-session',
      };

      const mockDecision: RouterDecision = {
        nextAgent: 'rag',
        confidence: 0.88,
        reasoning: 'This query requires knowledge base information',
      };

      mockGLMClient.generateCompletion.mockResolvedValue(JSON.stringify(mockDecision));

      // Act
      const result = await routerAgent.routeMessage(state);

      // Assert
      expect(result.nextAgent).toBe('rag');
      expect(result.confidence).toBe(0.88);
      expect(result.reasoning).toContain('knowledge base');
    });

    it('should route action-oriented queries to tools agent', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('What is the weather like in New York?')],
        sessionId: 'test-session',
      };

      const mockDecision: RouterDecision = {
        nextAgent: 'tools',
        confidence: 0.92,
        reasoning: 'This query requires external tool execution',
      };

      mockGLMClient.generateCompletion.mockResolvedValue(JSON.stringify(mockDecision));

      // Act
      const result = await routerAgent.routeMessage(state);

      // Assert
      expect(result.nextAgent).toBe('tools');
      expect(result.confidence).toBe(0.92);
      expect(result.reasoning).toContain('external tool');
    });

    it('should handle conversation context in routing decisions', async () => {
      // Arrange
      const state: AgentState = {
        messages: [
          new HumanMessage('Tell me about Python'),
          new AIMessage('Python is a programming language...'),
          new HumanMessage('Can you check the current time?'),
        ],
        sessionId: 'test-session',
      };

      const mockDecision: RouterDecision = {
        nextAgent: 'tools',
        confidence: 0.90,
        reasoning: 'User is now asking for current time, which requires a tool',
      };

      mockGLMClient.generateCompletion.mockResolvedValue(JSON.stringify(mockDecision));

      // Act
      const result = await routerAgent.routeMessage(state);

      // Assert
      expect(result.nextAgent).toBe('tools');
      expect(mockGLMClient.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('current time')
      );
    });

    it('should default to chat agent for unclear routing decisions', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('asdfghjkl')],
        sessionId: 'test-session',
      };

      const mockDecision: RouterDecision = {
        nextAgent: 'chat',
        confidence: 0.60,
        reasoning: 'Query is unclear, defaulting to general conversation',
      };

      mockGLMClient.generateCompletion.mockResolvedValue(JSON.stringify(mockDecision));

      // Act
      const result = await routerAgent.routeMessage(state);

      // Assert
      expect(result.nextAgent).toBe('chat');
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should handle empty message history', async () => {
      // Arrange
      const state: AgentState = {
        messages: [],
        sessionId: 'test-session',
      };

      // Act & Assert
      await expect(routerAgent.routeMessage(state)).rejects.toThrow('No messages to route');
    });

    it('should handle invalid routing decisions from LLM', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello')],
        sessionId: 'test-session',
      };

      mockGLMClient.generateCompletion.mockResolvedValue('invalid json');

      // Act & Assert
      await expect(routerAgent.routeMessage(state)).rejects.toThrow('Failed to parse routing decision');
    });

    it('should handle GLM API errors', async () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('Hello')],
        sessionId: 'test-session',
      };

      mockGLMClient.generateCompletion.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(routerAgent.routeMessage(state)).rejects.toThrow('Failed to route message');
    });
  });

  describe('createRoutingPrompt', () => {
    it('should create appropriate routing prompt', () => {
      // Arrange
      const state: AgentState = {
        messages: [new HumanMessage('What time is it?')],
        sessionId: 'test-session',
      };

      // Act
      const prompt = routerAgent.createRoutingPrompt(state);

      // Assert
      expect(prompt).toContain('route the following message');
      expect(prompt).toContain('chat', 'rag', 'tools');
      expect(prompt).toContain('JSON format');
    });

    it('should include conversation context in prompt', () => {
      // Arrange
      const state: AgentState = {
        messages: [
          new HumanMessage('Previous question'),
          new AIMessage('Previous answer'),
          new HumanMessage('Follow-up question'),
        ],
        sessionId: 'test-session',
      };

      // Act
      const prompt = routerAgent.createRoutingPrompt(state);

      // Assert
      expect(prompt).toContain('Previous question');
      expect(prompt).toContain('Previous answer');
      expect(prompt).toContain('Follow-up question');
    });
  });

  describe('parseRoutingDecision', () => {
    it('should parse valid routing decision JSON', () => {
      // Arrange
      const jsonString = JSON.stringify({
        nextAgent: 'chat',
        confidence: 0.95,
        reasoning: 'General conversation',
      });

      // Act
      const result = routerAgent.parseRoutingDecision(jsonString);

      // Assert
      expect(result.nextAgent).toBe('chat');
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toBe('General conversation');
    });

    it('should handle malformed JSON', () => {
      // Arrange
      const jsonString = '{ invalid json }';

      // Act & Assert
      expect(() => routerAgent.parseRoutingDecision(jsonString)).toThrow('Failed to parse routing decision');
    });

    it('should handle missing required fields', () => {
      // Arrange
      const jsonString = JSON.stringify({
        confidence: 0.95,
        // Missing nextAgent and reasoning
      });

      // Act & Assert
      expect(() => routerAgent.parseRoutingDecision(jsonString)).toThrow('Invalid routing decision format');
    });
  });
});