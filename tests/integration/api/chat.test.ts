/**
 * Integration tests for Chat API Route
 * RED PHASE: These tests should FAIL initially
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Mock GLM client
vi.mock('@/lib/llm/glm', () => ({
  getGLMClient: vi.fn(() => ({
    streamCompletion: vi.fn(),
  })),
}));

// Mock session storage
vi.mock('@/lib/memory/session', () => ({
  saveSession: vi.fn(),
  loadSession: vi.fn(),
}));

describe('/api/chat Route', () => {
  let mockRequest: any;
  let mockGLMClient: any;
  let mockSessionStorage: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup GLM client mock
    const { getGLMClient } = require('@/lib/llm/glm');
    mockGLMClient = getGLMClient();

    // Setup session storage mock
    mockSessionStorage = require('@/lib/memory/session');

    // Setup default request
    mockRequest = {
      json: vi.fn(),
      headers: new Map([
        ['content-type', 'application/json'],
      ]),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/chat', () => {
    it('should handle valid chat request with streaming response', async () => {
      // Arrange
      const requestData = {
        message: 'Hello, how are you?',
        sessionId: 'test-session-123',
      };

      mockRequest.json.mockResolvedValue(requestData);

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Hello' };
          yield { content: '! I' };
          yield { content: ' am' };
          yield { content: ' doing' };
          yield { content: ' well.' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);
      mockSessionStorage.loadSession.mockResolvedValue({
        messages: [],
        sessionId: 'test-session-123',
      });

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(response.headers.get('connection')).toBe('keep-alive');

      // Verify streaming content
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let chunks = [];

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(decoder.decode(value));
          }
        }
      }

      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('Hello! I am doing well.');
    });

    it('should generate new session ID if not provided', async () => {
      // Arrange
      const requestData = {
        message: 'Hello',
      };

      mockRequest.json.mockResolvedValue(requestData);

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Hi there!' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);
      mockSessionStorage.loadSession.mockResolvedValue(null); // No existing session

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(mockSessionStorage.loadSession).toHaveBeenCalledWith(
        expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      );
    });

    it('should load existing session state', async () => {
      // Arrange
      const requestData = {
        message: 'Follow up question',
        sessionId: 'existing-session-456',
      };

      mockRequest.json.mockResolvedValue(requestData);

      const existingState = {
        messages: [
          { role: 'user', content: 'Previous question', timestamp: new Date() },
          { role: 'assistant', content: 'Previous answer', timestamp: new Date() },
        ],
        sessionId: 'existing-session-456',
      };

      mockSessionStorage.loadSession.mockResolvedValue(existingState);

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'I remember our previous conversation.' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(mockSessionStorage.loadSession).toHaveBeenCalledWith('existing-session-456');
      expect(mockGLMClient.streamCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Follow up question')
      );
    });

    it('should save session state after streaming', async () => {
      // Arrange
      const requestData = {
        message: 'Hello',
        sessionId: 'test-session-789',
      };

      mockRequest.json.mockResolvedValue(requestData);

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Hello' };
          yield { content: ' back!' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);
      mockSessionStorage.loadSession.mockResolvedValue({
        messages: [],
        sessionId: 'test-session-789',
      });

      // Mock delay to simulate async operation
      mockSessionStorage.saveSession.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Act
      const response = await POST(mockRequest);

      // Consume the stream to trigger save
      const reader = response.body?.getReader();
      if (reader) {
        let done = false;
        while (!done) {
          await reader.read();
        }
      }

      // Wait a bit for async save operation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(mockSessionStorage.saveSession).toHaveBeenCalledWith(
        'test-session-789',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'Hello' }),
            expect.objectContaining({ role: 'assistant', content: 'Hello back!' }),
          ]),
          sessionId: 'test-session-789',
        })
      );
    });

    it('should handle malformed request JSON', async () => {
      // Arrange
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toBe('Invalid request format');
    });

    it('should handle missing message field', async () => {
      // Arrange
      const requestData = {
        sessionId: 'test-session',
        // Missing message field
      };

      mockRequest.json.mockResolvedValue(requestData);

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toBe('Message is required');
    });

    it('should handle GLM streaming errors', async () => {
      // Arrange
      const requestData = {
        message: 'Hello',
        sessionId: 'test-session',
      };

      mockRequest.json.mockResolvedValue(requestData);
      mockSessionStorage.loadSession.mockResolvedValue({
        messages: [],
        sessionId: 'test-session',
      });

      mockGLMClient.streamCompletion.mockRejectedValue(new Error('GLM API Error'));

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to process message');
    });

    it('should handle session storage errors', async () => {
      // Arrange
      const requestData = {
        message: 'Hello',
        sessionId: 'test-session',
      };

      mockRequest.json.mockResolvedValue(requestData);
      mockSessionStorage.loadSession.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to load session');
    });

    it('should validate message content', async () => {
      // Arrange
      const requestData = {
        message: '<script>alert("xss")</script>',
        sessionId: 'test-session',
      };

      mockRequest.json.mockResolvedValue(requestData);
      mockSessionStorage.loadSession.mockResolvedValue({
        messages: [],
        sessionId: 'test-session',
      });

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'I received your message.' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      // Verify that HTML was sanitized in the message passed to GLM
      expect(mockGLMClient.streamCompletion).toHaveBeenCalledWith(
        expect.stringContaining('&lt;script&gt;')
      );
    });

    it('should include agent metadata in SSE events', async () => {
      // Arrange
      const requestData = {
        message: 'Hello',
        sessionId: 'test-session',
      };

      mockRequest.json.mockResolvedValue(requestData);

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Hello' };
          yield { content: ' there!' };
        },
      };

      mockGLMClient.streamCompletion.mockReturnValue(mockStream);
      mockSessionStorage.loadSession.mockResolvedValue({
        messages: [],
        sessionId: 'test-session',
      });

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/plain');

      // Verify SSE format
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let events = [];

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            events.push(chunk);
          }
        }
      }

      const fullResponse = events.join('');
      expect(fullResponse).toContain('data:');
      expect(fullResponse).toContain('agent: chat');
      expect(fullResponse).toContain('Hello there!');
    });
  });
});