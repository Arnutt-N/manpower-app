/**
 * useSSE hook - Manages Server-Sent Events connections
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEMessage {
  type: 'status' | 'chunk' | 'complete' | 'error';
  agent: string;
  content: string;
  timestamp: string;
  metadata?: {
    status?: string;
    processingTime?: number;
    messageId?: string;
    error?: string;
  };
}

export interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: (finalMessage: SSEMessage) => void;
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UseSSEReturn {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  lastMessage: SSEMessage | null;
  connect: (url: string, options?: RequestInit) => void;
  disconnect: () => void;
  retryCount: number;
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    onMessage,
    onError,
    onComplete,
    reconnect = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsStreaming(false);
    setRetryCount(0);
  }, []);

  const connect = useCallback((url: string, requestOptions?: RequestInit) => {
    // Clean up any existing connection
    disconnect();

    try {
      setError(null);
      setIsStreaming(true);

      // Create new EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setRetryCount(0);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEMessage;
          setLastMessage(data);

          // Handle different message types
          switch (data.type) {
            case 'status':
              setIsStreaming(true);
              break;
            case 'chunk':
              setIsStreaming(true);
              break;
            case 'complete':
              setIsStreaming(false);
              onComplete?.(data);
              break;
            case 'error':
              setIsStreaming(false);
              setError(data.metadata?.error || 'Unknown error occurred');
              onError?.(new Error(data.metadata?.error || 'Unknown error'));
              break;
          }

          onMessage?.(data);
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
          setError('Failed to parse server response');
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        setIsConnected(false);
        setIsStreaming(false);

        // Handle reconnection logic
        if (reconnect && retryCount < maxRetries) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);

          retryTimeoutRef.current = setTimeout(() => {
            console.log(`Retrying connection (${newRetryCount}/${maxRetries})...`);
            connect(url, requestOptions);
          }, retryDelay * newRetryCount);
        } else {
          setError('Connection failed');
          onError?.(new Error('Connection failed'));
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
      setIsStreaming(false);
      setError('Failed to establish connection');
      onError?.(error instanceof Error ? error : new Error('Connection error'));
    }
  }, [disconnect, reconnect, maxRetries, retryDelay, retryCount, onMessage, onError, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isStreaming,
    error,
    lastMessage,
    connect,
    disconnect,
    retryCount,
  };
}