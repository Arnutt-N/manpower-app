# Implementation Plan: Multi-Agent Chat Application

**Branch**: `001-multi-agent-chat` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)

## Summary

Build a full-stack Next.js chat application powered by a multi-agent system using LangGraph and LangChain. The system routes user queries intelligently between a conversational agent, a RAG-based knowledge retrieval agent, and a tool-execution agent. Core LLM is GLM-4.6 API with streaming responses via SSE, persistent conversation memory, and MCP integration for file system operations.

**Primary Requirement**: Enable users to have intelligent conversations that automatically leverage the right AI capability (general chat, knowledge retrieval, or tool execution) based on query context.

**Technical Approach**:
- LangGraph state machine orchestrates multi-agent routing
- ChromaDB vector store for RAG document retrieval
- Redis/JSON-based session persistence
- Server-Sent Events for real-time response streaming
- MCP protocol integration for extensible tool ecosystem

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+, Python 3.11 (for MCP server)

**Primary Dependencies**:
- **Frontend**: Next.js 15.x (latest), React 19, TailwindCSS 4.x
- **AI/Orchestration**: LangChain, LangGraph, @langchain/community
- **LLM**: GLM-4.6 API (Zhipu AI) via ChatOpenAI-compatible interface
- **Vector Store**: ChromaDB for document embeddings
- **Memory**: Upstash Redis (or JSON file for development)
- **MCP**: `@modelcontextprotocol/sdk` for MCP client integration
- **Real-time**: Native Node.js SSE implementation with React Server Components
- **Testing**: Vitest (replacing Jest), React Testing Library, Playwright

**Storage**:
- **Session Data**: Upstash Redis (production) or JSON file (development)
- **Vector Embeddings**: ChromaDB (persistent SQLite-backed store)
- **Document Storage**: File system for ingested documents

**Testing**:
- **Unit**: Vitest + React Testing Library (business logic, components, utilities - Next.js 15 recommended testing framework)
- **Integration**: Vitest + Supertest (API routes, LangGraph flows)
- **E2E**: Playwright (critical user journeys: P1 basic chat, P2 RAG, P3 tools)

**Target Platform**: Web (desktop and mobile browsers), deployed on Vercel/Node.js server

**Project Type**: Web application (Next.js 15 full-stack with App Router, React Server Components, and Partial Prerendering)

**Performance Goals**:
- API response time: <500ms p95 (basic chat), <1s p95 (RAG queries)
- SSE token streaming latency: <100ms between tokens
- Concurrent users: ≥10 without degradation
- Lighthouse score: ≥85

**Constraints**:
- Must work with GLM-4.6 API (Zhipu AI endpoint)
- ChromaDB embeddings must persist across restarts
- Session state must survive page refreshes
- TypeScript strict mode required
- No hardcoded API keys or secrets

**Scale/Scope**:
- Initial: Single-user MVP with ~5-10 sample documents
- Phase 2: Multi-user support with user authentication
- Phase 3: Production-scale with 100+ concurrent users

---

## Constitution Check

*GATE: Must pass before implementation. Re-checked during code review.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **Quality-First Development** | ✅ Compliant | Automated quality gates: TypeScript strict mode, ESLint, Prettier. Code reviews required. |
| **Test-Driven Development** | ⚠️ Partial | Unit tests for services/utilities (80%+), integration tests for API routes (70%+). E2E tests for P1 (basic chat) mandatory. P2/P3/P4 E2E tests deferred based on priority. |
| **UX Consistency** | ✅ Compliant | TailwindCSS design system, consistent chat UI patterns, accessible components (WCAG 2.1 AA), responsive design (mobile-first). |
| **Performance by Design** | ✅ Compliant | Performance budgets defined (response time, bundle size). SSE streaming for perceived performance. ChromaDB indexing for fast retrieval. |
| **Security by Default** | ✅ Compliant | API key in environment variables only. Input sanitization on all user messages. Rate limiting on API routes. MCP restricted to safe paths. |

### Violations

**TDD Partial Compliance**:
- **Why Needed**: E2E tests for P2 (RAG), P3 (Tools), and P4 (MCP) are deferred to allow rapid MVP iteration. Writing comprehensive E2E tests for all features upfront would delay delivery significantly.
- **Risk**: Potential regression in RAG/Tool agent functionality during development.
- **Mitigation**:
  - P1 (basic chat) E2E tests are mandatory before merge
  - Manual testing checklist for P2/P3/P4 during development
  - Integration tests provide partial coverage for agent logic
  - E2E tests for P2/P3/P4 added before production deployment

### Risks
- **GLM-4.6 API Reliability**: External dependency on Zhipu AI service
  - *Mitigation*: Implement retry logic with exponential backoff, graceful degradation messaging
- **ChromaDB Performance**: Vector search latency on large document sets
  - *Mitigation*: Start with small document set (<100 docs), profile and optimize if needed
- **MCP Integration Complexity**: MCP protocol requires Python subprocess or separate server
  - *Mitigation*: P4 (MCP) is lowest priority, can be dropped if integration proves too complex

---

## Project Structure

### Documentation (this feature)

```
specs/001-multi-agent-chat/
├── spec.md              # Feature specification (DONE)
├── plan.md              # This file (DONE)
├── tasks.md             # Task breakdown by priority (NEXT)
├── research.md          # (Optional) Research notes on LangGraph, GLM-4.6, MCP
└── contracts/           # (Optional) API contract schemas
```

### Source Code (repository root)

```
# Web Application Structure (Next.js 15 App Router)

src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing/redirect page
│   ├── chat/
│   │   └── page.tsx              # Main chat interface (P1)
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # SSE streaming endpoint (P1)
│   │   └── ingest/
│   │       └── route.ts          # Document ingestion endpoint (P2)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles (TailwindCSS)
│
├── lib/                          # Core business logic
│   ├── llm/
│   │   └── glm.ts                # GLM-4.6 LLM setup (P1)
│   ├── agents/
│   │   ├── graph.ts              # LangGraph state machine (P1)
│   │   ├── router.ts             # Router agent (P1)
│   │   ├── chat.ts               # Chat agent (P1)
│   │   ├── rag.ts                # RAG agent (P2)
│   │   └── tools.ts              # Tool agent (P3)
│   ├── memory/
│   │   ├── session.ts            # Session persistence (P2)
│   │   └── store.ts              # Redis/JSON storage adapter (P2)
│   ├── rag/
│   │   ├── vectorstore.ts        # ChromaDB setup (P2)
│   │   ├── retriever.ts          # Document retrieval (P2)
│   │   └── chain.ts              # RAG chain construction (P2)
│   ├── tools/
│   │   ├── weather.ts            # Weather tool (P3)
│   │   ├── time.ts               # System time tool (P3)
│   │   └── mcp-file.ts           # MCP file reader (P4)
│   ├── mcp/
│   │   └── client.ts             # MCP client integration (P4)
│   └── types/
│       ├── agent.ts              # Agent state types
│       ├── message.ts            # Message types
│       └── session.ts            # Session types
│
├── components/                   # React components
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat container (P1)
│   │   ├── MessageList.tsx       # Message display (P1)
│   │   ├── MessageInput.tsx      # Input field (P1)
│   │   ├── MessageBubble.tsx     # Single message component (P1)
│   │   └── AgentIndicator.tsx    # Agent status indicator (P1)
│   └── ui/
│       ├── Button.tsx            # Reusable button
│       ├── Input.tsx             # Reusable input
│       └── Spinner.tsx           # Loading spinner
│
├── hooks/                        # Custom React hooks
│   ├── useChat.ts                # Chat state management (P1)
│   └── useSSE.ts                 # SSE connection hook (P1)
│
└── utils/                        # Utilities
    ├── validation.ts             # Input validation
    └── formatting.ts             # Message formatting

tests/
├── unit/                         # Unit tests (60% of tests)
│   ├── agents/
│   │   ├── router.test.ts
│   │   ├── chat.test.ts
│   │   ├── rag.test.ts
│   │   └── tools.test.ts
│   ├── memory/
│   │   └── session.test.ts
│   └── utils/
│       └── validation.test.ts
│
├── integration/                  # Integration tests (30% of tests)
│   ├── api/
│   │   └── chat.test.ts          # API route tests
│   └── agents/
│       └── graph.test.ts         # Full graph flow tests
│
└── e2e/                          # E2E tests (10% of tests)
    └── chat.spec.ts              # P1 user journey (mandatory)

scripts/                          # Utility scripts
└── ingest-docs.ts                # Document ingestion script (P2)

data/                             # Sample documents for RAG
└── sample-docs/                  # (P2)
    ├── example1.txt
    └── example2.md

public/                           # Static assets
└── [Next.js defaults]

.env.local.example                # Environment variables template
.eslintrc.json                    # ESLint configuration
.prettierrc                       # Prettier configuration
tsconfig.json                     # TypeScript configuration (strict mode)
tailwind.config.ts                # TailwindCSS configuration
jest.config.js                    # Jest configuration
playwright.config.ts              # Playwright configuration (E2E)
package.json                      # Dependencies and scripts
README.md                         # Project documentation
```

**Structure Decision**:

Web application structure selected based on Next.js 14 App Router architecture. This structure separates:
- **Frontend** (`app/`, `components/`, `hooks/`): React UI layer
- **Backend** (`lib/`, `app/api/`): API routes and business logic
- **Tests** (`tests/`): Organized by test type (unit, integration, e2e)

This structure follows Next.js conventions while maintaining clean separation of concerns. The `lib/` directory contains all core business logic (agents, memory, tools), making it easily testable and framework-agnostic. API routes in `app/api/` serve as thin controllers that orchestrate `lib/` modules.

---

## Complexity Tracking

*No constitutional violations requiring justification. Partial TDD compliance is documented in Constitution Check with approved mitigation plan.*

---

## Implementation Phases

### Phase 0: Project Setup (Foundational)
- Initialize Next.js project with TypeScript
- Configure ESLint, Prettier, TypeScript strict mode
- Set up TailwindCSS
- Create project structure directories
- Install dependencies (LangChain, LangGraph, ChromaDB, etc.)
- Configure environment variables template

### Phase 1: Basic Chat (P1 - MVP)
**Goal**: Users can send messages and receive streaming AI responses

- Implement GLM-4.6 LLM client
- Create basic LangGraph with router and chat agents
- Build API route with SSE streaming
- Create chat UI components (MessageList, MessageInput, MessageBubble)
- Implement useSSE hook for frontend SSE connection
- Write unit tests for chat agent
- Write E2E test for basic conversation

### Phase 2: Session Persistence (P2 - Critical UX)
**Goal**: Conversations persist across page refreshes

- Implement session storage (JSON file for dev, Redis for production)
- Add session ID generation and management
- Update API route to load/save state
- Update chat UI to restore conversation history
- Write integration tests for session persistence

### Phase 3: RAG Integration (P2 - Knowledge Retrieval)
**Goal**: AI can answer questions from custom documents

- Set up ChromaDB vector store
- Create document ingestion script
- Implement RAG agent with retriever
- Add document citation display in UI
- Write unit tests for RAG chain
- Write integration tests for full RAG flow

### Phase 4: Tool Execution (P3 - Actions)
**Goal**: AI can execute tools like weather lookup

- Implement weather tool (`get_current_weather`)
- Implement time tool (`get_system_time`)
- Create tool agent in LangGraph
- Add tool execution indicators in UI
- Write unit tests for tools
- Write integration tests for tool agent

### Phase 5: MCP Integration (P4 - Advanced)
**Goal**: AI can read local files via MCP protocol

- Set up MCP client integration
- Implement `read_file_via_mcp` tool
- Add MCP configuration and documentation
- Write integration tests for MCP tool

### Phase 6: Polish & Production Readiness
**Goal**: System is production-ready

- Add comprehensive error handling
- Implement rate limiting
- Add loading states and optimistic UI updates
- Optimize bundle size and performance
- Complete E2E test suite (P2, P3, P4)
- Security audit and input validation review
- Performance testing and optimization
- Deployment configuration (Vercel/Docker)

---

## Key Technical Decisions

### 1. **LangGraph for Agent Orchestration**
- **Decision**: Use LangGraph's StateGraph for agent routing
- **Rationale**: Provides declarative agent flow control, built-in state persistence, and easy testing
- **Alternative Rejected**: Manual agent switching logic (harder to maintain and test)

### 2. **SSE for Streaming with React Server Components**
- **Decision**: Server-Sent Events for response streaming, leveraging Next.js 15 streaming capabilities
- **Rationale**: Native browser support, enhanced by Next.js 15 Server Components streaming, simpler than WebSockets, works with Vercel
- **Alternative Rejected**: WebSockets (unnecessary complexity for this use case)

### 3. **ChromaDB for Vector Store**
- **Decision**: ChromaDB as the vector database
- **Rationale**: Easy to embed, persistent SQLite backend, good Python/TypeScript support
- **Alternative Rejected**: Pinecone (requires external service), FAISS (less persistent)

### 4. **Redis for Session Persistence**
- **Decision**: Upstash Redis for production, JSON file for development
- **Rationale**: Fast key-value store, TTL support, Vercel-compatible (Upstash)
- **Alternative Rejected**: PostgreSQL (overkill for simple key-value storage)

### 5. **Next.js 15 with App Router**
- **Decision**: Use Next.js 15 App Router with latest features (React 19, Partial Prerendering, enhanced caching)
- **Rationale**: Latest React patterns (Server Components, Actions), better performance with Turbopack, improved streaming, enhanced TypeScript support
- **Alternative Rejected**: Next.js 14 (missing Partial Prerendering and React 19 features), Pages Router (legacy)

---

## Testing Strategy

### Test Coverage Goals
- **Unit Tests**: ≥80% for `lib/` modules (agents, memory, tools, utils)
- **Integration Tests**: ≥70% for API routes and full agent flows
- **E2E Tests**: P1 basic chat (mandatory), P2/P3/P4 added before production

### Critical Test Scenarios
1. **Unit**: Router agent correctly classifies queries (chat vs RAG vs tool)
2. **Unit**: Session store correctly saves and loads conversation state
3. **Integration**: Full chat flow from user input → LLM → SSE stream → frontend
4. **Integration**: RAG flow retrieves correct documents and generates answers
5. **Integration**: Tool agent executes weather tool and returns formatted data
6. **E2E**: User sends "Hello" → receives AI response → refreshes page → history preserved

### Testing Tools
- **Unit/Integration**: Vitest + Testing Library (Next.js 15 recommended, faster than Jest)
- **E2E**: Playwright (headless browser testing)
- **Mocking**: MSW (Mock Service Worker) for API mocking

---

## Security Considerations

1. **API Key Management**: GLM-4.6 API key stored in environment variables only, never committed
2. **Input Sanitization**: All user messages sanitized before processing
3. **Rate Limiting**: API routes rate-limited to prevent abuse
4. **MCP Path Restrictions**: MCP file access restricted to safe directories only
5. **CORS**: API routes configure proper CORS headers
6. **Error Messages**: Generic error messages to users (no stack traces or internal details)

---

## Performance Optimization

1. **Response Streaming**: SSE streaming for perceived speed (users see responses as they're generated)
2. **Vector Search Optimization**: ChromaDB indexing for fast similarity search (<100ms)
3. **Bundle Optimization**: Code splitting for chat page, lazy loading for non-critical components
4. **Caching**: Redis caching for frequently accessed session data
5. **Parallel Processing**: Concurrent tool execution when possible

---

## Deployment Plan

### Development
- Local Next.js dev server (`npm run dev`)
- JSON file for session storage
- ChromaDB local instance

### Staging
- Vercel preview deployment
- Upstash Redis (free tier)
- ChromaDB persistent volume

### Production
- Vercel production deployment
- Upstash Redis (production instance)
- ChromaDB persistent volume
- Environment variable management via Vercel dashboard
- Monitoring: Vercel Analytics, Sentry for error tracking

---

## Next Steps

1. ✅ Feature specification completed (`spec.md`)
2. ✅ Implementation plan completed (`plan.md`)
3. ⏭️ Generate task breakdown (`tasks.md`) with `/speckit.tasks` command
4. ⏭️ Begin Phase 0: Project setup
5. ⏭️ Implement P1: Basic chat with E2E test
6. ⏭️ Iterate through P2, P3, P4 based on priorities
