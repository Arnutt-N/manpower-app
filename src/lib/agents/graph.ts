/**
 * LangGraph State Machine - Orchestrates multi-agent chat system
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ChatAgent } from './chat';
import { RouterAgent } from './router';
import { AgentState, GraphState } from '@/lib/types/agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Define the graph state schema
const GraphStateSchema = {
  messages: {
    value: (x: any[], y: any[]) => x.concat(y),
    default: () => [],
  },
  sessionId: {
    value: (x: string, y: string) => y || x,
    default: () => '',
  },
  userId: {
    value: (x: string | undefined, y: string | undefined) => y || x,
    default: () => undefined,
  },
  nextAgent: {
    value: (x: string | undefined, y: string | undefined) => y || x,
    default: () => undefined,
  },
  retrievedDocs: {
    value: (x: any[], y: any[]) => y || x,
    default: () => [],
  },
  toolResults: {
    value: (x: any[], y: any[]) => y || x,
    default: () => [],
  },
  context: {
    value: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
    default: () => ({}),
  },
};

export class MultiAgentGraph {
  private chatAgent: ChatAgent;
  private routerAgent: RouterAgent;
  private graph: StateGraph<GraphState>;

  constructor() {
    this.chatAgent = new ChatAgent();
    this.routerAgent = new RouterAgent();
    this.graph = this.buildGraph();
  }

  /**
   * Build the LangGraph state machine
   */
  private buildGraph(): StateGraph<GraphState> {
    const workflow = new StateGraph({ channels: GraphStateSchema });

    // Add nodes
    workflow.addNode('router', this.routeNode.bind(this));
    workflow.addNode('chat', this.chatNode.bind(this));
    workflow.addNode('rag', this.ragNode.bind(this));
    workflow.addNode('tools', this.toolsNode.bind(this));

    // Set entry point
    workflow.setEntryPoint('router');

    // Add conditional edges from router
    workflow.addConditionalEdges(
      'router',
      this.routeDecision.bind(this),
      {
        chat: 'chat',
        rag: 'rag',
        tools: 'tools',
      }
    );

    // Add edges from specialist agents back to router
    workflow.addEdge('chat', END);
    workflow.addEdge('rag', END);
    workflow.addEdge('tools', END);

    return workflow.compile();
  }

  /**
   * Router node - decides which agent should handle the message
   */
  private async routeNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const agentState: AgentState = {
        messages: state.messages,
        sessionId: state.sessionId,
        userId: state.userId,
        nextAgent: state.nextAgent,
        retrievedDocs: state.retrievedDocs,
        toolResults: state.toolResults,
        context: state.context,
      };

      const decision = await this.routerAgent.routeMessage(agentState);

      return {
        nextAgent: decision.nextAgent,
        context: {
          ...state.context,
          routingDecision: decision,
        },
      };
    } catch (error) {
      console.error('Router node error:', error);
      // Default to chat agent on routing error
      return {
        nextAgent: 'chat',
        context: {
          ...state.context,
          routingError: String(error),
        },
      };
    }
  }

  /**
   * Chat node - handles general conversation
   */
  private async chatNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const agentState: AgentState = {
        messages: state.messages,
        sessionId: state.sessionId,
        userId: state.userId,
        nextAgent: state.nextAgent,
        retrievedDocs: state.retrievedDocs,
        toolResults: state.toolResults,
        context: state.context,
      };

      const response = await this.chatAgent.processMessage(agentState);

      const assistantMessage = new AIMessage(response.content);

      return {
        messages: [assistantMessage],
        context: {
          ...state.context,
          lastAgent: 'chat',
          agentMetadata: response.metadata,
        },
      };
    } catch (error) {
      console.error('Chat node error:', error);
      const errorMessage = new AIMessage('Sorry, I encountered an error while processing your message. Please try again.');
      return {
        messages: [errorMessage],
        context: {
          ...state.context,
          lastAgent: 'chat',
          chatError: String(error),
        },
      };
    }
  }

  /**
   * RAG node - handles knowledge-based queries (placeholder for now)
   */
  private async ragNode(state: GraphState): Promise<Partial<GraphState>> {
    // For now, this is a placeholder. We'll implement full RAG in User Story 2
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const content = typeof lastMessage === 'object' ? lastMessage.content : String(lastMessage);

      const responseContent = `I understand you're asking about: "${content}". RAG functionality will be implemented in a future update. For now, I'll provide a general response based on my training.`;

      const assistantMessage = new AIMessage(responseContent);

      return {
        messages: [assistantMessage],
        context: {
          ...state.context,
          lastAgent: 'rag',
          ragPlaceholder: true,
        },
      };
    } catch (error) {
      console.error('RAG node error:', error);
      const errorMessage = new AIMessage('Sorry, I encountered an error with the knowledge retrieval system.');
      return {
        messages: [errorMessage],
        context: {
          ...state.context,
          lastAgent: 'rag',
          ragError: String(error),
        },
      };
    }
  }

  /**
   * Tools node - handles tool execution (placeholder for now)
   */
  private async toolsNode(state: GraphState): Promise<Partial<GraphState>> {
    // For now, this is a placeholder. We'll implement full tools in User Story 3
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const content = typeof lastMessage === 'object' ? lastMessage.content : String(lastMessage);

      const responseContent = `I understand you're asking me to perform an action: "${content}". Tool execution functionality will be implemented in a future update. For now, I'll provide information based on my general knowledge.`;

      const assistantMessage = new AIMessage(responseContent);

      return {
        messages: [assistantMessage],
        context: {
          ...state.context,
          lastAgent: 'tools',
          toolsPlaceholder: true,
        },
      };
    } catch (error) {
      console.error('Tools node error:', error);
      const errorMessage = new AIMessage('Sorry, I encountered an error while trying to execute tools.');
      return {
        messages: [errorMessage],
        context: {
          ...state.context,
          lastAgent: 'tools',
          toolsError: String(error),
        },
      };
    }
  }

  /**
   * Conditional routing logic
   */
  private routeDecision(state: GraphState): string {
    return state.nextAgent || 'chat';
  }

  /**
   * Process a message through the graph
   */
  async processMessage(state: Partial<GraphState>): Promise<GraphState> {
    const initialState: GraphState = {
      messages: state.messages || [],
      sessionId: state.sessionId || '',
      userId: state.userId,
      nextAgent: state.nextAgent,
      retrievedDocs: state.retrievedDocs || [],
      toolResults: state.toolResults || [],
      context: state.context || {},
    };

    const result = await this.graph.invoke(initialState);
    return result;
  }

  /**
   * Stream a message through the graph (for real-time responses)
   */
  async* streamMessage(state: Partial<GraphState>): AsyncGenerator<{
    agent: string;
    content: string;
    metadata?: any;
  }, void, unknown> {
    const initialState: GraphState = {
      messages: state.messages || [],
      sessionId: state.sessionId || '',
      userId: state.userId,
      nextAgent: state.nextAgent,
      retrievedDocs: state.retrievedDocs || [],
      toolResults: state.toolResults || [],
      context: state.context || {},
    };

    // First, get routing decision
    yield {
      agent: 'router',
      content: 'Analyzing your request...',
      metadata: { status: 'routing' },
    };

    const routingResult = await this.graph.invoke(initialState);
    const nextAgent = routingResult.context?.lastAgent || 'chat';

    yield {
      agent: nextAgent,
      content: `${nextAgent.charAt(0).toUpperCase() + nextAgent.slice(1)} agent is processing your request...`,
      metadata: { status: 'processing' },
    };

    // For now, simulate streaming with the chat agent
    if (nextAgent === 'chat' && routingResult.messages.length > 0) {
      const lastMessage = routingResult.messages[routingResult.messages.length - 1];
      const content = typeof lastMessage === 'object' ? lastMessage.content : String(lastMessage);

      // Simulate streaming by breaking up the response
      const words = content.split(' ');
      for (const word of words) {
        yield {
          agent: 'chat',
          content: word + ' ',
          metadata: { status: 'streaming' },
        };
        // Small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Get the compiled graph for advanced usage
   */
  getGraph(): StateGraph<GraphState> {
    return this.graph;
  }
}