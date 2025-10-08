/**
 * Chat API Route - Handles streaming chat responses via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateChatRequest } from '@/utils/validation';
import { MultiAgentGraph } from '@/lib/agents/graph';
import { sessionManager, messagesToAgentState, agentStateToMessages } from '@/lib/memory/session';
import { Message } from '@/lib/types/message';
import { HumanMessage } from '@langchain/core/messages';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validation = validateChatRequest(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors?.join(', ') || 'Invalid request' },
        { status: 400 }
      );
    }

    const { message: sanitizedMessage, sessionId, userId } = validation.data!;

    // Load existing session state
    let existingState;
    try {
      existingState = await sessionManager.loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
      return NextResponse.json(
        { error: 'Failed to load session' },
        { status: 500 }
      );
    }

    // Create new message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
    };

    // Convert messages to AgentState format
    const existingMessages = existingState ? agentStateToMessages(existingState) : [];
    const allMessages = [...existingMessages, userMessage];

    const agentState = messagesToAgentState(allMessages, sessionId, userId);

    // Initialize multi-agent graph
    const graph = new MultiAgentGraph();

    // Create Server-Sent Events response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const statusData = `data: ${JSON.stringify({
            type: 'status',
            agent: 'system',
            content: 'Processing your message...',
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(statusData));

          // Stream the response through the graph
          let fullResponse = '';
          let currentAgent = 'chat';

          for await (const chunk of graph.streamMessage(agentState)) {
            currentAgent = chunk.agent;
            fullResponse += chunk.content;

            // Send streaming chunk
            const chunkData = `data: ${JSON.stringify({
              type: 'chunk',
              agent: chunk.agent,
              content: chunk.content,
              timestamp: new Date().toISOString(),
              metadata: chunk.metadata,
            })}\n\n`;

            controller.enqueue(encoder.encode(chunkData));
          }

          // Create assistant message
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
            metadata: {
              agent: currentAgent,
              processingTime: Date.now(),
            },
          };

          // Update session state with new messages
          const updatedMessages = [...allMessages, assistantMessage];
          const updatedState = messagesToAgentState(updatedMessages, sessionId, userId);

          // Save updated session state
          await sessionManager.saveSession(sessionId, updatedState);

          // Send completion signal
          const completionData = `data: ${JSON.stringify({
            type: 'complete',
            agent: currentAgent,
            content: fullResponse,
            timestamp: new Date().toISOString(),
            messageId: assistantMessage.id,
          })}\n\n`;

          controller.enqueue(encoder.encode(completionData));

        } catch (error) {
          console.error('Streaming error:', error);

          // Send error message
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            agent: 'system',
            content: 'Sorry, I encountered an error while processing your message.',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`;

          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}