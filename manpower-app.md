# Project: Next.js Multi-Agent Chat App

## Goal
Build a full-stack Next.js chat application powered by a multi-agent system using LangGraph and LangChain. The core LLM will be the GLM-4.6 API. The system must feature persistent memory, tool calling, MCP integration, and a RAG pipeline.

## Tech Stack
- **Framework**: Next.js 14+ with TypeScript
- **AI/Orchestration**: LangChain, LangGraph
- **LLM**: GLM-4.6 API (Zhipu AI)
- **Memory**: LangGraph's persistent state + a simple database (e.g., Upstash Redis or a JSON file for demo)
- **RAG**: LangChain document loaders, text splitters, ChromaDB as vector store.
- **Tool Calling**: LangChain tool decorator.
- **MCP**: Python `mcp` library to connect to a sample MCP server (e.g., a filesystem server).
- **Frontend**: React components for chat UI.
- **Real-time**: Server-Sent Events (SSE) for streaming responses.

## Step-by-Step Implementation Plan

### 1. Project Initialization
- Create a new Next.js project: `npx create-next-app@latest multi-agent-chat --typescript`
- Install dependencies: `npm install langchain langgraph @langchain/community axios uuid chromadb`
- Create a `.env.local` file for `GLM_API_KEY`.

### 2. Backend Core: LangGraph Multi-Agent System
- **File**: `lib/agents/graph.ts`
- **State**: Define a `TypedDict` for the graph state: `messages`, `user_id`, `session_id`.
- **LLM Setup**: Create a `lib/llm.ts` file. Export a function `getLLM()` that returns a `ChatOpenAI` instance configured for the GLM-4.6 API endpoint and key.
- **Agents**:
    - **Router Agent (`lib/agents/router.ts`)**: A function that takes the state, uses the LLM to decide the next step ('chat', 'rag', 'tool'), and returns a command to route to the correct node.
    - **Chat Agent (`lib/agents/chat.ts`)**: A standard conversational agent. It receives the full state (messages) and generates a response.
    - **RAG Agent (`lib/agents/rag.ts`)**: This node will be responsible for the RAG pipeline.
    - **Tool Agent (`lib/agents/tools.ts`)**: This node will be responsible for executing tools.
- **Graph Construction (`lib/agents/graph.ts`)**:
    - Create a `StateGraph` with the defined state.
    - Add nodes for the router, chat, rag, and tools agents.
    - Set the entry point to the `router` node.
    - Add conditional edges from the `router` to the other agents based on its decision.
    - Add edges from `rag`, `tools` back to the `chat` agent to summarize the final answer.
    - Compile the graph.

### 3. Memory Implementation
- **File**: `lib/memory.ts`
- Create functions `saveState(sessionId, state)` and `loadState(sessionId)`.
- For a demo, use a simple in-memory object or a file system. For production, use a database like Redis.
- In the API route, load the state before invoking the graph and save it after each step.

### 4. Tool Calling
- **File**: `lib/tools/index.ts`
- Define at least two tools using the `@tool` decorator:
    1. `get_current_weather(location: string)`: Fetches weather from a public API.
    2. `get_system_time()`: Returns the current system time.
- Bind these tools to the LLM instance that the `Tool Agent` will use.

### 5. RAG Pipeline
- **File**: `lib/rag/chain.ts`
- **Data Ingestion Script**: `scripts/ingest_data.ts`
    - Load documents from a `data/` directory.
    - Use `RecursiveCharacterTextSplitter`.
    - Use an embedding model (e.g., from GLM or OpenAI).
    - Store embeddings in a ChromaDB collection.
- **Retriever Setup**: In `lib/rag/chain.ts`, create a retriever from the ChromaDB collection.
- **RAG Chain**: Use `createRetrievalChain` to create a chain that takes a user question, retrieves relevant documents, and generates an answer.
- The `RAG Agent` node will invoke this chain.

### 6. MCP Integration
- **File**: `lib/mcp/client.ts`
- Install the MCP client library: `pip install mcp` (Note: This might require a separate Python process or a serverless function for execution).
- Create a function `executeMCPAction(action, params)` that connects to a running MCP server (e.g., `npx @modelcontextprotocol/server-filesystem /tmp`), sends a request, and returns the result.
- Create a specific tool, e.g., `read_file_via_mcp(path: string)`, that uses this function.
- Bind this tool to the `Tool Agent`.

### 7. API Route (Backend Endpoint)
- **File**: `pages/api/chat.ts` (or `app/api/chat/route.ts`)
- This is an SSE endpoint.
- On POST request, get `message`, `user_id`, `session_id`.
- Load the conversation state from memory using `session_id`.
- Initialize the LangGraph app.
- Use `graph.astream({ messages: [new HumanMessage(message)], ...initialState })` to run the graph.
- As each event from `astream` comes in, format it (e.g., `data: ${JSON.stringify({ agent: node_name, message: chunk.content })}\n\n`) and write it to the SSE stream.
- After the stream ends, save the final state to memory.

### 8. Frontend UI
- **File**: `pages/chat.tsx` and `components/Chat.tsx`
- Create a React component with:
    - A list to display messages.
    - An input field and a send button.
- Use `useEffect` and `EventSource` to connect to the `/api/chat` endpoint.
- Listen for `message` events on the `EventSource`, parse the JSON, and update the UI to show which agent is "thinking" and stream the response content in real-time.
- When the user sends a message, make a `POST` request to `/api/chat` with the message and session info.

## Final Deliverable
A fully functional Next.js application where a user can have a conversation. The app should intelligently route questions to a general chatbot, a RAG system for knowledge-based queries, or a tool-using agent for actions, all while maintaining the conversation history. The UI should clearly indicate the process.