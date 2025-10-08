/**
 * Router Agent - Intelligently routes messages to appropriate specialist agents
 */

import { getGLMClient } from '@/lib/llm/glm';
import { AgentState, RouterDecision } from '@/lib/types/agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export class RouterAgent {
  private glmClient = getGLMClient();

  /**
   * Analyze message and determine which agent should handle it
   */
  async routeMessage(state: AgentState): Promise<RouterDecision> {
    if (!state.messages || state.messages.length === 0) {
      throw new Error('No messages to route');
    }

    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent = this.extractMessageContent(lastMessage);

    if (!messageContent) {
      throw new Error('No message content found');
    }

    try {
      const routingPrompt = this.createRoutingPrompt(state);
      const response = await this.glmClient.generateCompletion(routingPrompt);

      const decision = this.parseRoutingDecision(response);

      // Validate the decision
      if (!this.isValidDecision(decision)) {
        // Default to chat agent for invalid decisions
        return {
          nextAgent: 'chat',
          confidence: 0.5,
          reasoning: 'Invalid routing decision, defaulting to chat agent',
        };
      }

      return decision;
    } catch (error) {
      console.error('RouterAgent error:', error);
      throw new Error('Failed to route message');
    }
  }

  /**
   * Create a prompt for the LLM to make routing decisions
   */
  createRoutingPrompt(state: AgentState): string {
    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent = this.extractMessageContent(lastMessage);

    let prompt = `You are a routing agent that determines which specialist AI agent should handle a user message.

Analyze the following message and decide which agent should handle it:

${this.formatConversationHistory(state.messages)}

Current message: "${messageContent}"

Available agents:
1. "chat" - For general conversational queries, greetings, casual conversation
2. "rag" - For questions that require knowledge base information, document retrieval, factual answers
3. "tools" - For requests that require external actions (weather, time, calculations, file operations)

Respond with a JSON object containing:
{
  "nextAgent": "chat" | "rag" | "tools",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this agent was chosen"
}

Consider:
- Does this require factual knowledge from documents? → rag
- Does this require real-time data or external actions? → tools
- Is this a general conversation? → chat
- Consider conversation context when making decisions`;

    return prompt;
  }

  /**
   * Parse the LLM response into a RouterDecision
   */
  parseRoutingDecision(response: string): RouterDecision {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.nextAgent || typeof parsed.confidence !== 'number' || !parsed.reasoning) {
        throw new Error('Invalid routing decision format');
      }

      // Validate agent value
      if (!['chat', 'rag', 'tools'].includes(parsed.nextAgent)) {
        throw new Error(`Invalid agent: ${parsed.nextAgent}`);
      }

      // Validate confidence range
      if (parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error(`Invalid confidence: ${parsed.confidence}`);
      }

      return {
        nextAgent: parsed.nextAgent as 'chat' | 'rag' | 'tools',
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Failed to parse routing decision:', error);
      throw new Error('Failed to parse routing decision');
    }
  }

  /**
   * Validate that a routing decision is acceptable
   */
  private isValidDecision(decision: RouterDecision): boolean {
    return (
      decision.nextAgent &&
      ['chat', 'rag', 'tools'].includes(decision.nextAgent) &&
      typeof decision.confidence === 'number' &&
      decision.confidence >= 0 &&
      decision.confidence <= 1 &&
      decision.reasoning &&
      decision.reasoning.length > 0
    );
  }

  /**
   * Format conversation history for the prompt
   */
  private formatConversationHistory(messages: any[]): string {
    if (messages.length <= 1) {
      return 'No previous conversation history.';
    }

    const history = messages.slice(0, -1).map((msg, index) => {
      const role = this.getRoleFromMessage(msg);
      const content = this.extractMessageContent(msg);
      return `${index + 1}. ${role}: ${content}`;
    }).join('\n');

    return `Previous conversation:\n${history}`;
  }

  /**
   * Extract role from message object
   */
  private getRoleFromMessage(message: any): string {
    if (message && typeof message === 'object') {
      if (message.role) {
        return message.role;
      }
      if (message.constructor === HumanMessage) {
        return 'User';
      }
      if (message.constructor === AIMessage) {
        return 'Assistant';
      }
    }
    return 'Unknown';
  }

  /**
   * Extract text content from a message object
   */
  private extractMessageContent(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message && typeof message === 'object') {
      if (message.content) {
        return typeof message.content === 'string' ? message.content : String(message.content);
      }

      if (message.text) {
        return typeof message.text === 'string' ? message.text : String(message.text);
      }
    }

    return '';
  }

  /**
   * Get routing confidence threshold for decision-making
   */
  getConfidenceThreshold(): number {
    return 0.7; // 70% confidence required for high-confidence routing
  }

  /**
   * Check if routing decision is high confidence
   */
  isHighConfidence(decision: RouterDecision): boolean {
    return decision.confidence >= this.getConfidenceThreshold();
  }
}