import React from 'react';
import { Message } from '@/lib/types/message';
import { MessageFormatter } from '@/utils/formatting';
import { cn } from '@/utils/cn';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  className,
}) => {
  const isUser = message.role === 'user';
  const formattedMetadata = MessageFormatter.formatMetadata(message);

  return (
    <div
      className={cn(
        'flex gap-3 max-w-4xl w-full',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      data-testid={`message-${message.role}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        )}
      >
        {isUser ? 'Y' : 'AI'}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-2 min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 max-w-none break-words',
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm',
            isStreaming && 'animate-pulse'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {MessageFormatter.formatContent(message.content)}
          </p>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        {(formattedMetadata.agent || formattedMetadata.toolCalls?.length || formattedMetadata.retrievedDocs?.length) && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {/* Agent */}
            {formattedMetadata.agent && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {formattedMetadata.agent}
              </span>
            )}

            {/* Tool Calls */}
            {formattedMetadata.toolCalls?.map((toolCall, index) => (
              <span key={index} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {toolCall}
              </span>
            ))}

            {/* Retrieved Documents */}
            {formattedMetadata.retrievedDocs?.map((doc, index) => (
              <span key={index} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                📄 {doc}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {MessageFormatter.formatTimestamp(message.timestamp)}
          {formattedMetadata.processingTime && (
            <span className="ml-2">
              ({formattedMetadata.processingTime})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};