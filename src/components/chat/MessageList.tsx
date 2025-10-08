import React from 'react';
import { Message } from '@/lib/types/message';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/utils/cn';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  className,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if the last message is streaming
  const lastMessage = messages[messages.length - 1];
  const isLastMessageStreaming = lastMessage?.metadata?.streaming;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col gap-4 p-4 overflow-y-auto',
        'min-h-0 flex-1',
        className
      )}
      data-testid="message-list"
    >
      {/* Welcome message when no messages */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Welcome to Multi-Agent Chat
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            I'm an AI assistant that can help you with conversations, knowledge retrieval, and tool execution.
            Feel free to ask me anything!
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isStreaming = isLastMessage && isLastMessageStreaming;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming}
          />
        );
      })}

      {/* Loading indicator */}
      {isLoading && messages.length === 0 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
            Thinking...
          </div>
        </div>
      )}

      {/* Invisible element for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};