/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

export class MessageValidator {
  private static readonly MAX_MESSAGE_LENGTH = 10000;
  private static readonly MIN_MESSAGE_LENGTH = 1;

  /**
   * Validate and sanitize user message input
   */
  static validateMessage(input: string): ValidationResult {
    // Handle null/undefined input
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        error: 'Message is required and must be a string',
      };
    }

    // Trim whitespace
    const trimmed = input.trim();

    // Length validation
    if (trimmed.length < this.MIN_MESSAGE_LENGTH) {
      return {
        isValid: false,
        error: 'Message cannot be empty',
      };
    }

    if (trimmed.length > this.MAX_MESSAGE_LENGTH) {
      return {
        isValid: false,
        error: `Message is too long. Maximum ${this.MAX_MESSAGE_LENGTH} characters allowed`,
      };
    }

    // Basic XSS prevention - remove potentially dangerous HTML
    const sanitized = this.sanitizeHtml(trimmed);

    // Check if sanitization removed everything
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'Message contains invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  /**
   * Basic HTML sanitization to prevent XSS
   */
  private static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): ValidationResult {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        isValid: false,
        error: 'Session ID is required',
      };
    }

    // Basic UUID format validation (simplified)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return {
        isValid: false,
        error: 'Invalid session ID format',
      };
    }

    return {
      isValid: true,
      sanitized: sessionId,
    };
  }

  /**
   * Validate user ID (optional field)
   */
  static validateUserId(userId?: string): ValidationResult {
    if (!userId) {
      return { isValid: true }; // User ID is optional
    }

    if (typeof userId !== 'string') {
      return {
        isValid: false,
        error: 'User ID must be a string',
      };
    }

    // Basic alphanumeric validation
    const userIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!userIdRegex.test(userId)) {
      return {
        isValid: false,
        error: 'User ID contains invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized: userId,
    };
  }
}

/**
 * Validation middleware for API requests
 */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ChatRequestValidation {
  isValid: boolean;
  data?: {
    message: string;
    sessionId: string;
    userId?: string;
  };
  errors?: string[];
}

export function validateChatRequest(request: ChatRequest): ChatRequestValidation {
  const errors: string[] = [];

  // Validate message
  const messageValidation = MessageValidator.validateMessage(request.message);
  if (!messageValidation.isValid) {
    errors.push(messageValidation.error || 'Invalid message');
  }

  // Validate session ID (generate if not provided)
  let sessionId = request.sessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  } else {
    const sessionValidation = MessageValidator.validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      errors.push(sessionValidation.error || 'Invalid session ID');
    }
  }

  // Validate user ID (optional)
  let userId: string | undefined;
  if (request.userId) {
    const userValidation = MessageValidator.validateUserId(request.userId);
    if (!userValidation.isValid) {
      errors.push(userValidation.error || 'Invalid user ID');
    } else {
      userId = userValidation.sanitized;
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    data: {
      message: messageValidation.sanitized!,
      sessionId: sessionId!,
      userId,
    },
  };
}