/**
 * Session persistence implementation
 */

import { AgentState, SessionStorage } from '@/lib/types/session';
import { Message } from '@/lib/types/message';

// In-memory session storage for development
const inMemorySessions = new Map<string, AgentState>();

export class SessionManager implements SessionStorage {
  /**
   * Save session state to storage
   */
  async saveSession(sessionId: string, state: AgentState): Promise<void> {
    try {
      // Add timestamps
      const stateWithTimestamps = {
        ...state,
        updatedAt: new Date(),
      };

      // For development, use in-memory storage
      inMemorySessions.set(sessionId, stateWithTimestamps);

      // For production, this would save to Redis or database
      // await this.saveToPersistentStorage(sessionId, stateWithTimestamps);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session');
    }
  }

  /**
   * Load session state from storage
   */
  async loadSession(sessionId: string): Promise<AgentState | null> {
    try {
      // For development, use in-memory storage
      let state = inMemorySessions.get(sessionId);

      if (state) {
        // For production, this would load from Redis or database
        // state = await this.loadFromPersistentStorage(sessionId);
        return state;
      }

      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      throw new Error('Failed to load session');
    }
  }

  /**
   * Delete session from storage
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // For development, use in-memory storage
      inMemorySessions.delete(sessionId);

      // For production, this would delete from Redis or database
      // await this.deleteFromPersistentStorage(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * List all session IDs (optionally filtered by user)
   */
  async listSessions(userId?: string): Promise<string[]> {
    try {
      const sessions = Array.from(inMemorySessions.keys());

      if (userId) {
        // Filter by user ID if provided
        return sessions.filter(sessionId => {
          const state = inMemorySessions.get(sessionId);
          return state?.userId === userId;
        });
      }

      return sessions;
    } catch (error) {
      console.error('Failed to list sessions:', error);
      throw new Error('Failed to list sessions');
    }
  }

  /**
   * Clean up old sessions (older than specified hours)
   */
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      const sessionsToDelete: string[] = [];

      for (const [sessionId, state] of inMemorySessions.entries()) {
        const updatedAt = state.updatedAt || new Date(0);
        if (updatedAt < cutoffTime) {
          sessionsToDelete.push(sessionId);
        }
      }

      for (const sessionId of sessionsToDelete) {
        await this.deleteSession(sessionId);
      }

      console.log(`Cleaned up ${sessionsToDelete.length} old sessions`);
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
  }> {
    try {
      const sessions = Array.from(inMemorySessions.values());
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const activeSessions = sessions.filter(state => {
        const updatedAt = state.updatedAt || new Date(0);
        return updatedAt > oneHourAgo;
      });

      const totalMessages = sessions.reduce((total, state) => {
        return total + (state.messages?.length || 0);
      }, 0);

      return {
        totalSessions: sessions.length,
        activeSessions: activeSessions.length,
        totalMessages,
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalMessages: 0,
      };
    }
  }

  // Placeholder methods for persistent storage (would be implemented in production)
  private async saveToPersistentStorage(sessionId: string, state: AgentState): Promise<void> {
    // This would implement Redis or database storage
    // Example Redis implementation:
    // await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(state));
  }

  private async loadFromPersistentStorage(sessionId: string): Promise<AgentState | null> {
    // This would implement Redis or database loading
    // Example Redis implementation:
    // const data = await redis.get(`session:${sessionId}`);
    // return data ? JSON.parse(data) : null;
    return null;
  }

  private async deleteFromPersistentStorage(sessionId: string): Promise<void> {
    // This would implement Redis or database deletion
    // await redis.del(`session:${sessionId}`);
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Convert Message array to AgentState format
 */
export function messagesToAgentState(
  messages: Message[],
  sessionId: string,
  userId?: string
): AgentState {
  return {
    messages,
    sessionId,
    userId,
    nextAgent: undefined,
    retrievedDocs: undefined,
    toolResults: undefined,
    context: {},
  };
}

/**
 * Convert AgentState to Message array format
 */
export function agentStateToMessages(state: AgentState): Message[] {
  return state.messages || [];
}