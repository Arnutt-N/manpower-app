/**
 * useChat hook - Manages chat state and interactions
 */

import { useState, useCallback, useRef } from 'react';
import { Message } from '@/lib/types/message';
import { useSSE, SSEMessage } from './useSSE';

export interface UseChatOptions {
  initialMessages?: Message[];
  sessionId?: string;
  userId?: string;
  onError?: (error: Error) => void;
  onMessage?: (message: Message) => void;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  sessionId: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => void;
  setSessionId: (sessionId: string) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialMessages = [],
    sessionId: initialSessionId,
    userId,
    onError,
    onMessage,
  } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string>(
    initialSessionId || crypto.randomUUID()
  );
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string>('chat');
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  // Ref to track the current streaming message
  const streamingMessageRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string>('');

  const { isConnected, isStreaming, error: sseError, connect, disconnect } = useSSE({
    onMessage: handleSSEMessage,
    onError: handleSSEError,
  });

  function handleSSEMessage(sseMessage: SSEMessage) {
    setCurrentAgent(sseMessage.agent);
    setError(null);

    switch (sseMessage.type) {
      case 'status':
        // Status messages don't affect the chat UI directly
        break;

      case 'chunk':
        // Handle streaming content
        if (!streamingMessageIdRef.current) {
          // Create new assistant message for streaming
          const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            metadata: {
              agent: sseMessage.agent,
              streaming: true,
            },
          };

          streamingMessageIdRef.current = newMessage.id;
          setMessages(prev => [...prev, newMessage]);
        }

        // Update the streaming message content
        streamingMessageRef.current += sseMessage.content;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: streamingMessageRef.current }
              : msg
          )
        );
        break;

      case 'complete':
        // Finalize the streaming message
        if (streamingMessageIdRef.current) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMessageIdRef.current
                ? {
                    ...msg,
                    content: streamingMessageRef.current,
                    metadata: {
                      ...msg.metadata,
                      streaming: false,
                      completed: true,
                      messageId: sseMessage.metadata?.messageId,
                    },
                  }
                : msg
            )
          );

          onMessage?.(messages[messages.length - 1]); // Notify about the completed message
        }

        // Reset streaming refs
        streamingMessageRef.current = '';
        streamingMessageIdRef.current = '';
        break;

      case 'error':
        setError(sseMessage.metadata?.error || 'An error occurred');
        // Clean up any partial streaming message
        if (streamingMessageIdRef.current) {
          setMessages(prev => prev.filter(msg => msg.id !== streamingMessageIdRef.current));
          streamingMessageRef.current = '';
          streamingMessageIdRef.current = '';
        }
        break;
    }
  }

  function handleSSEError(error: Error) {
    setError(error.message);
    onError?.(error);

    // Clean up any partial streaming message
    if (streamingMessageIdRef.current) {
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessageIdRef.current));
      streamingMessageRef.current = '';
      streamingMessageIdRef.current = '';
    }
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (isStreaming) {
      setError('Please wait for the current response to complete');
      return;
    }

    try {
      setError(null);
      setLastUserMessage(content);

      // Add user message to chat
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Connect to SSE endpoint
      const apiUrl = new URL('/api/chat', window.location.origin);
      apiUrl.searchParams.set('t', Date.now().toString()); // Prevent caching

      connect(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          sessionId,
          userId,
        }),
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      onError?.(error instanceof Error ? error : new Error('Send message failed'));
    }
  }, [content, isStreaming, sessionId, userId, connect, onError, onMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    streamingMessageRef.current = '';
    streamingMessageIdRef.current = '';
  }, []);

  const retryLastMessage = useCallback(() => {
    if (lastUserMessage && !isStreaming) {
      sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, isStreaming, sendMessage]);

  const handleSetSessionId = useCallback((newSessionId: string) => {
    setSessionId(newSessionId);
    clearMessages();
  }, [clearMessages]);

  return {
    messages,
    isLoading: isStreaming,
    error: error || sseError,
    isConnected,
    sessionId,
    sendMessage,
    clearMessages,
    retryLastMessage,
    setSessionId: handleSetSessionId,
  };
}