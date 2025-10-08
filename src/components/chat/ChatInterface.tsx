import React from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { AgentIndicator } from './AgentIndicator';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface ChatInterfaceProps {
  initialSessionId?: string;
  userId?: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialSessionId,
  userId,
  className,
}) => {
  const {
    messages,
    isLoading,
    error,
    isConnected,
    sessionId,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useChat({
    sessionId: initialSessionId,
    userId,
  });

  const [showAgentIndicator, setShowAgentIndicator] = React.useState(false);
  const [currentAgent, setCurrentAgent] = React.useState('chat');

  // Show agent indicator when loading
  React.useEffect(() => {
    setShowAgentIndicator(isLoading);
    if (!isLoading) {
      // Hide indicator after a short delay
      const timer = setTimeout(() => setShowAgentIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleRetry = () => {
    retryLastMessage();
  };

  const handleClear = () => {
    clearMessages();
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden',
        className
      )}
      data-testid="chat-container"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Multi-Agent Chat</h2>
          {isConnected ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-red-600 dark:text-red-400">Disconnected</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Session: {sessionId.slice(0, 8)}...
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Agent Status Indicator */}
      {showAgentIndicator && (
        <div className="px-4 py-2 border-b border-border bg-muted/20">
          <AgentIndicator agent={currentAgent} status="processing" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 text-destructive mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="text-destructive hover:text-destructive/80"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading && messages.length === 0}
        className="flex-1"
      />

      {/* Loading indicator when streaming */}
      {isLoading && messages.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          AI is responding...
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
      />
    </div>
  );
};