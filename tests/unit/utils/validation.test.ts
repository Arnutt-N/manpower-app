/**
 * Unit tests for Validation utilities
 * RED PHASE: These tests should FAIL initially
 */

import { describe, it, expect } from 'vitest';
import { MessageValidator, validateChatRequest } from '@/utils/validation';

describe('MessageValidator', () => {
  describe('validateMessage', () => {
    it('should accept valid message', () => {
      // Arrange
      const input = 'Hello, how are you?';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello, how are you?');
    });

    it('should reject empty message', () => {
      // Arrange
      const input = '';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should reject whitespace-only message', () => {
      // Arrange
      const input = '   \n\t   ';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should reject null/undefined message', () => {
      // Act & Assert
      expect(MessageValidator.validateMessage(null as any)).toEqual({
        isValid: false,
        error: 'Message is required and must be a string',
      });

      expect(MessageValidator.validateMessage(undefined as any)).toEqual({
        isValid: false,
        error: 'Message is required and must be a string',
      });
    });

    it('should reject non-string message', () => {
      // Arrange
      const input = 123;

      // Act
      const result = MessageValidator.validateMessage(input as any);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message is required and must be a string');
    });

    it('should reject message that is too long', () => {
      // Arrange
      const input = 'a'.repeat(10001);

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Message is too long');
    });

    it('should sanitize HTML in message', () => {
      // Arrange
      const input = 'Hello <script>alert("xss")</script> world';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt; world');
    });

    it('should handle special characters properly', () => {
      // Arrange
      const input = 'Hello "world" & <test> value';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello &quot;world&quot; &amp; &lt;test&gt; value');
    });

    it('should reject message that becomes empty after sanitization', () => {
      // Arrange
      const input = '<script></script>';

      // Act
      const result = MessageValidator.validateMessage(input);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message contains invalid characters');
    });
  });

  describe('validateSessionId', () => {
    it('should accept valid UUID', () => {
      // Arrange
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = MessageValidator.validateSessionId(sessionId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(sessionId);
    });

    it('should reject invalid UUID format', () => {
      // Arrange
      const sessionId = 'invalid-uuid';

      // Act
      const result = MessageValidator.validateSessionId(sessionId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid session ID format');
    });

    it('should reject empty session ID', () => {
      // Arrange
      const sessionId = '';

      // Act
      const result = MessageValidator.validateSessionId(sessionId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session ID is required');
    });

    it('should reject null session ID', () => {
      // Act
      const result = MessageValidator.validateSessionId(null as any);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session ID is required');
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      // Arrange
      const userId = 'user123';

      // Act
      const result = MessageValidator.validateUserId(userId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(userId);
    });

    it('should accept user ID with underscores and hyphens', () => {
      // Arrange
      const userId = 'user_123-abc';

      // Act
      const result = MessageValidator.validateUserId(userId);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(userId);
    });

    it('should accept empty user ID (optional field)', () => {
      // Act
      const result = MessageValidator.validateUserId('');

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should accept undefined user ID (optional field)', () => {
      // Act
      const result = MessageValidator.validateUserId(undefined);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should reject user ID with special characters', () => {
      // Arrange
      const userId = 'user@123';

      // Act
      const result = MessageValidator.validateUserId(userId);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('User ID contains invalid characters');
    });

    it('should reject non-string user ID', () => {
      // Arrange
      const userId = 123;

      // Act
      const result = MessageValidator.validateUserId(userId as any);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('User ID must be a string');
    });
  });
});

describe('validateChatRequest', () => {
  it('should validate complete valid request', () => {
    // Arrange
    const request = {
      message: 'Hello world',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user123',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.message).toBe('Hello world');
    expect(result.data!.sessionId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.data!.userId).toBe('user123');
  });

  it('should generate session ID if not provided', () => {
    // Arrange
    const request = {
      message: 'Hello world',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should reject request with invalid message', () => {
    // Arrange
    const request = {
      message: '',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Message cannot be empty');
  });

  it('should reject request with invalid session ID', () => {
    // Arrange
    const request = {
      message: 'Hello world',
      sessionId: 'invalid-uuid',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid session ID format');
  });

  it('should reject request with invalid user ID', () => {
    // Arrange
    const request = {
      message: 'Hello world',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user@123',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('User ID contains invalid characters');
  });

  it('should accumulate multiple validation errors', () => {
    // Arrange
    const request = {
      message: '',
      sessionId: 'invalid-uuid',
      userId: 'user@123',
    };

    // Act
    const result = validateChatRequest(request);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
    expect(result.errors).toContain('Message cannot be empty');
    expect(result.errors).toContain('Invalid session ID format');
    expect(result.errors).toContain('User ID contains invalid characters');
  });
});