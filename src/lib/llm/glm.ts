/**
 * GLM-4.6 LLM client configuration
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

export interface GLMConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export class GLMClient {
  private client: ChatOpenAI;
  private config: GLMConfig;

  constructor(config: GLMConfig) {
    this.config = {
      model: 'glm-4',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
      ...config,
    };

    this.client = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
      openAIProxyUrl: this.config.baseUrl,
      configuration: {
        baseURL: this.config.baseUrl,
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
      },
    });
  }

  /**
   * Get configured GLM client instance
   */
  getClient(): ChatOpenAI {
    return this.client;
  }

  /**
   * Generate a completion for a single message
   */
  async generateCompletion(
    message: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const messages: (HumanMessage | SystemMessage)[] = [new HumanMessage(message)];

      if (options?.systemPrompt) {
        messages.unshift(new SystemMessage(options.systemPrompt));
      }

      const response = await this.client.invoke(messages, {
        temperature: options?.temperature ?? this.config.temperature,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
      });

      return response.content as string;
    } catch (error) {
      console.error('GLM API Error:', error);
      throw new Error(`Failed to generate GLM completion: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Stream a completion for real-time responses
   */
  async* streamCompletion(
    message: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      const messages: (HumanMessage | SystemMessage)[] = [new HumanMessage(message)];

      if (options?.systemPrompt) {
        messages.unshift(new SystemMessage(options.systemPrompt));
      }

      const stream = await this.client.stream(messages, {
        temperature: options?.temperature ?? this.config.temperature,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    } catch (error) {
      console.error('GLM Streaming Error:', error);
      throw new Error(`Failed to stream GLM completion: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Test the GLM connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateCompletion('Hello', { maxTokens: 10 });
      return true;
    } catch (error) {
      console.error('GLM Connection Test Failed:', error);
      return false;
    }
  }

  /**
   * Extract meaningful error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }

    return 'Unknown error occurred';
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    model: string;
    temperature: number;
    maxTokens: number;
    baseUrl: string;
  } {
    return {
      model: this.config.model!,
      temperature: this.config.temperature!,
      maxTokens: this.config.maxTokens!,
      baseUrl: this.config.baseUrl!,
    };
  }
}

/**
 * Default GLM client instance
 */
let defaultGLMClient: GLMClient | null = null;

/**
 * Get or create the default GLM client
 */
export function getGLMClient(): GLMClient {
  if (!defaultGLMClient) {
    const apiKey = process.env.GLM_API_KEY;

    if (!apiKey) {
      throw new Error('GLM_API_KEY environment variable is required');
    }

    defaultGLMClient = new GLMClient({
      apiKey,
    });
  }

  return defaultGLMClient;
}

/**
 * Initialize GLM client with custom configuration
 */
export function initializeGLMClient(config: GLMConfig): GLMClient {
  defaultGLMClient = new GLMClient(config);
  return defaultGLMClient;
}

/**
 * Reset the default GLM client (mainly for testing)
 */
export function resetGLMClient(): void {
  defaultGLMClient = null;
}