import React from 'react';
import { cn } from '@/utils/cn';

interface AgentIndicatorProps {
  agent: string;
  status?: 'thinking' | 'processing' | 'streaming' | 'complete' | 'error';
  className?: string;
}

const agentDisplayNames: Record<string, string> = {
  router: 'Router',
  chat: 'Chat Agent',
  rag: 'Knowledge Agent',
  tools: 'Tool Agent',
  system: 'System',
};

const statusMessages: Record<string, string> = {
  thinking: 'Analyzing your request...',
  processing: 'Processing...',
  streaming: 'Generating response...',
  complete: 'Response complete',
  error: 'An error occurred',
};

const statusIcons: Record<string, React.ReactNode> = {
  thinking: (
    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
  ),
  processing: (
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin"></div>
  ),
  streaming: (
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  ),
  complete: (
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  ),
  error: (
    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
  ),
};

const statusColors: Record<string, string> = {
  thinking: 'text-yellow-600 dark:text-yellow-400',
  processing: 'text-blue-600 dark:text-blue-400',
  streaming: 'text-green-600 dark:text-green-400',
  complete: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
};

export const AgentIndicator: React.FC<AgentIndicatorProps> = ({
  agent,
  status = 'thinking',
  className,
}) => {
  const displayName = agentDisplayNames[agent] || agent;
  const statusMessage = statusMessages[status];
  const icon = statusIcons[status];
  const colorClass = statusColors[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border',
        colorClass,
        className
      )}
      data-testid="agent-status"
    >
      {icon}
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {displayName}
        </span>
        <span className="text-xs opacity-75">
          {statusMessage}
        </span>
      </div>
    </div>
  );
};