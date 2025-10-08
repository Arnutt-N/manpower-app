/**
 * Message formatting and display utilities
 */

import { Message, ToolCall, RetrievedDocument } from '@/lib/types/message';

export class MessageFormatter {
  /**
   * Format message content for display
   */
  static formatContent(content: string): string {
    if (!content) return '';

    return content
      .trim()
      // Preserve code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `\`\`\`${lang || ''}\n${code.trim()}\`\`\``;
      })
      // Format line breaks
      .replace(/\n\n+/g, '\n\n')
      // Clean up extra whitespace
      .replace(/[ \t]+/g, ' ');
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format full date and time
   */
  static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format message role for display
   */
  static formatRole(role: string): string {
    switch (role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Assistant';
      case 'system':
        return 'System';
      default:
        return role;
    }
  }

  /**
   * Format agent name for display
   */
  static formatAgent(agent?: string): string {
    if (!agent) return '';

    switch (agent) {
      case 'chat':
        return 'Chat Agent';
      case 'rag':
        return 'Knowledge Agent';
      case 'tools':
        return 'Tool Agent';
      case 'router':
        return 'Router Agent';
      default:
        return agent.charAt(0).toUpperCase() + agent.slice(1) + ' Agent';
    }
  }

  /**
   * Format tool calls for display
   */
  static formatToolCalls(toolCalls?: ToolCall[]): string[] {
    if (!toolCalls || toolCalls.length === 0) return [];

    return toolCalls.map((tool) => {
      const status = tool.error ? '❌' : '✅';
      const name = this.formatToolName(tool.name);
      const result = tool.error ? 'Failed' : 'Success';

      return `${status} ${name}: ${result}`;
    });
  }

  /**
   * Format individual tool name
   */
  static formatToolName(toolName: string): string {
    switch (toolName) {
      case 'get_current_weather':
        return 'Weather Check';
      case 'get_system_time':
        return 'System Time';
      case 'read_file_via_mcp':
        return 'File Reader';
      default:
        return toolName
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }

  /**
   * Format retrieved documents for display
   */
  static formatRetrievedDocs(docs?: RetrievedDocument[]): string[] {
    if (!docs || docs.length === 0) return [];

    return docs.map((doc, index) => {
      const source = doc.source || 'Unknown source';
      const score = Math.round(doc.score * 100);
      return `${index + 1}. ${source} (${score}% match)`;
    });
  }

  /**
   * Format processing time
   */
  static formatProcessingTime(ms?: number): string {
    if (!ms) return '';

    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }

  /**
   * Format message metadata for display
   */
  static formatMetadata(message: Message): {
    toolCalls?: string[];
    retrievedDocs?: string[];
    processingTime?: string;
    agent?: string;
  } {
    const result: {
      toolCalls?: string[];
      retrievedDocs?: string[];
      processingTime?: string;
      agent?: string;
    } = {};

    if (message.metadata?.toolCalls) {
      result.toolCalls = this.formatToolCalls(message.metadata.toolCalls);
    }

    if (message.metadata?.retrievedDocs) {
      result.retrievedDocs = this.formatRetrievedDocs(message.metadata.retrievedDocs);
    }

    if (message.metadata?.processingTime) {
      result.processingTime = this.formatProcessingTime(message.metadata.processingTime);
    }

    if (message.metadata?.agent) {
      result.agent = this.formatAgent(message.metadata.agent);
    }

    return result;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Extract plain text from markdown
   */
  static extractPlainText(markdown: string): string {
    return markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]*`/g, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}