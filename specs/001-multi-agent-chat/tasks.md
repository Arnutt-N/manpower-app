# Tasks: Multi-Agent Chat Application

**Input**: Design documents from `/specs/001-multi-agent-chat/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: Tests are REQUIRED per constitution (TDD principle). E2E tests for P1 are mandatory before merge.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 15 project with TypeScript: `npx create-next-app@latest . --typescript --app --tailwind --eslint --turbopack`
- [ ] T002 Install core dependencies: `npm install langchain langgraph @langchain/community axios uuid chromadb`
- [ ] T003 [P] Install testing dependencies: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @playwright/test ts-node`
- [ ] T004 [P] Configure TypeScript strict mode in `tsconfig.json`
- [ ] T005 [P] Configure ESLint rules in `.eslintrc.json`
- [ ] T006 [P] Configure Prettier in `.prettierrc`
- [ ] T007 [P] Configure Vitest in `vitest.config.ts` (Next.js 15 recommended testing framework)
- [ ] T008 [P] Configure Playwright in `playwright.config.ts`
- [ ] T009 Create `.env.local.example` with template environment variables
- [ ] T010 Create project directory structure per `plan.md` (src/lib/, src/app/, src/components/, tests/)
- [ ] T011 [P] Setup TailwindCSS 4.x configuration in `tailwind.config.ts`
- [ ] T012 [P] Create global styles in `src/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 Define TypeScript types for Message in `src/lib/types/message.ts`
- [ ] T014 [P] Define TypeScript types for Session in `src/lib/types/session.ts`
- [ ] T015 [P] Define TypeScript types for AgentState in `src/lib/types/agent.ts`
- [ ] T016 Create input validation utilities in `src/utils/validation.ts` (sanitize user inputs)
- [ ] T017 [P] Create message formatting utilities in `src/utils/formatting.ts`
- [ ] T018 Configure GLM-4.6 LLM client in `src/lib/llm/glm.ts` using ChatOpenAI-compatible interface
- [ ] T019 Create reusable UI components: Button in `src/components/ui/Button.tsx`
- [ ] T020 [P] Create reusable UI components: Input in `src/components/ui/Input.tsx`
- [ ] T021 [P] Create reusable UI components: Spinner in `src/components/ui/Spinner.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Chat Conversation (Priority: P1) 🎯 MVP

**Goal**: Users can have natural text conversations with streaming AI responses

**Independent Test**: Open chat interface, send "Hello, how are you?", receive coherent AI response

### Tests for User Story 1 ⚠️ WRITE TESTS FIRST (Red Phase)

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US1] Unit test for chat agent in `tests/unit/agents/chat.test.ts` (test message processing, context handling) using Vitest
- [ ] T023 [P] [US1] Unit test for router agent in `tests/unit/agents/router.test.ts` (test routing logic to "chat" mode) using Vitest
- [ ] T024 [P] [US1] Unit test for validation utilities in `tests/unit/utils/validation.test.ts` (test input sanitization) using Vitest
- [ ] T025 [US1] Integration test for `/api/chat` route in `tests/integration/api/chat.test.ts` (test SSE stream, message flow) using Vitest
- [ ] T026 [US1] E2E test for basic chat journey in `tests/e2e/chat.spec.ts` (user sends message → receives response → response streams) using Playwright

### Implementation for User Story 1 (Green Phase)

- [ ] T027 [P] [US1] Implement Chat Agent in `src/lib/agents/chat.ts` (conversational logic with GLM-4.6)
- [ ] T028 [P] [US1] Implement Router Agent in `src/lib/agents/router.ts` (route to "chat" mode initially)
- [ ] T029 [US1] Create LangGraph state machine in `src/lib/agents/graph.ts` (connect router → chat agent)
- [ ] T030 [US1] Create SSE API route in `src/app/api/chat/route.ts` (handle POST, stream responses using Next.js 15 streaming capabilities)
- [ ] T031 [P] [US1] Create useSSE custom hook in `src/hooks/useSSE.ts` (manage SSE connection, parse events)
- [ ] T032 [P] [US1] Create useChat custom hook in `src/hooks/useChat.ts` (manage chat state, send messages)
- [ ] T033 [US1] Create MessageBubble component in `src/components/chat/MessageBubble.tsx` (display single message)
- [ ] T034 [US1] Create MessageList component in `src/components/chat/MessageList.tsx` (display message history)
- [ ] T035 [US1] Create MessageInput component in `src/components/chat/MessageInput.tsx` (input field + send button)
- [ ] T036 [US1] Create AgentIndicator component in `src/components/chat/AgentIndicator.tsx` (show "AI is thinking...")
- [ ] T037 [US1] Create ChatInterface container in `src/components/chat/ChatInterface.tsx` (orchestrate all chat components)
- [ ] T038 [US1] Create chat page in `src/app/chat/page.tsx` (render ChatInterface)
- [ ] T039 [US1] Update root page in `src/app/page.tsx` (redirect to /chat)
- [ ] T040 [US1] Add error handling in API route for GLM-4.6 failures (retry logic, user-friendly errors)
- [ ] T041 [US1] Add loading states and optimistic UI updates in ChatInterface

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Run E2E test (T026) to validate.

---

## Phase 4: User Story 5 - Session Management and Persistence (Priority: P2)

**Goal**: Conversations persist across page refreshes and browser sessions

**Independent Test**: Start conversation, refresh page, verify history is restored

**Note**: Implementing US5 (session persistence) before US2 (RAG) because it's foundational for all other features and tightly coupled with US1.

### Tests for User Story 5 ⚠️ WRITE TESTS FIRST (Red Phase)

- [ ] T042 [P] [US5] Unit test for session store in `tests/unit/memory/session.test.ts` (test save/load operations) using Vitest
- [ ] T043 [US5] Integration test for session persistence in `tests/integration/api/chat.test.ts` (test state restoration after simulated refresh) using Vitest

### Implementation for User Story 5 (Green Phase)

- [ ] T044 [P] [US5] Create session storage adapter in `src/lib/memory/store.ts` (JSON file adapter for dev)
- [ ] T045 [US5] Implement session persistence logic in `src/lib/memory/session.ts` (saveState, loadState functions)
- [ ] T046 [US5] Update API route in `src/app/api/chat/route.ts` to load state on request start
- [ ] T047 [US5] Update API route in `src/app/api/chat/route.ts` to save state after streaming completes
- [ ] T048 [US5] Generate unique session IDs in `src/hooks/useChat.ts` (use UUID)
- [ ] T049 [US5] Update ChatInterface to restore conversation history on mount from session ID
- [ ] T050 [US5] Add session ID to API request headers for state tracking
- [ ] T051 [US5] (Optional Production) Implement Upstash Redis adapter in `src/lib/memory/store.ts`

**Checkpoint**: User Stories 1 AND 5 should both work independently. Conversations persist across refreshes.

---

## Phase 5: User Story 2 - Knowledge-Based Questions with RAG (Priority: P2)

**Goal**: AI answers questions from custom documents using RAG pipeline

**Independent Test**: Ingest sample docs, ask "What features does Product X have?", verify AI retrieves document content

### Tests for User Story 2 ⚠️ WRITE TESTS FIRST (Red Phase)

- [ ] T052 [P] [US2] Unit test for RAG chain in `tests/unit/agents/rag.test.ts` (test document retrieval, answer generation) using Vitest
- [ ] T053 [US2] Integration test for full RAG flow in `tests/integration/agents/graph.test.ts` (test router → RAG agent → response) using Vitest

### Implementation for User Story 2 (Green Phase)

- [ ] T054 [P] [US2] Setup ChromaDB client in `src/lib/rag/vectorstore.ts` (persistent collection)
- [ ] T055 [P] [US2] Create document retriever in `src/lib/rag/retriever.ts` (similarity search interface)
- [ ] T056 [US2] Create RAG chain in `src/lib/rag/chain.ts` (combine retriever + LLM with prompt template)
- [ ] T057 [US2] Implement RAG Agent in `src/lib/agents/rag.ts` (invoke RAG chain, format citations)
- [ ] T058 [US2] Update Router Agent in `src/lib/agents/router.ts` to route knowledge questions to RAG agent
- [ ] T059 [US2] Update LangGraph in `src/lib/agents/graph.ts` to add RAG agent node and edges
- [ ] T060 [US2] Create document ingestion script in `scripts/ingest-docs.ts` (load, split, embed, store documents)
- [ ] T061 [US2] Create sample documents directory `data/sample-docs/` with 3-5 example files
- [ ] T062 [US2] Update AgentIndicator component to show "Searching knowledge base..." status
- [ ] T063 [US2] Update MessageBubble component to display document citations (if available in metadata)
- [ ] T064 [US2] Create API route for document ingestion in `src/app/api/ingest/route.ts` (POST endpoint to ingest files)

**Checkpoint**: User Stories 1, 5, AND 2 should all work independently. RAG queries retrieve and cite documents.

---

## Phase 6: User Story 3 - Tool Execution for Actions (Priority: P3)

**Goal**: AI performs actions like checking weather and getting system time

**Independent Test**: Ask "What's the weather in San Francisco?", verify AI calls tool and returns real data

### Tests for User Story 3 ⚠️ WRITE TESTS FIRST (Red Phase)

- [ ] T065 [P] [US3] Unit test for weather tool in `tests/unit/tools/weather.test.ts` (test API call, error handling) using Vitest
- [ ] T066 [P] [US3] Unit test for time tool in `tests/unit/tools/time.test.ts` (test time retrieval) using Vitest
- [ ] T067 [P] [US3] Unit test for tool agent in `tests/unit/agents/tools.test.ts` (test tool orchestration) using Vitest
- [ ] T068 [US3] Integration test for tool execution flow in `tests/integration/agents/graph.test.ts` (test router → tool agent → response) using Vitest

### Implementation for User Story 3 (Green Phase)

- [ ] T069 [P] [US3] Implement weather tool in `src/lib/tools/weather.ts` (use public weather API like OpenWeatherMap)
- [ ] T070 [P] [US3] Implement system time tool in `src/lib/tools/time.ts` (return current timestamp)
- [ ] T071 [US3] Implement Tool Agent in `src/lib/agents/tools.ts` (execute tools, bind to LLM)
- [ ] T072 [US3] Update Router Agent in `src/lib/agents/router.ts` to route tool-requiring queries to tool agent
- [ ] T073 [US3] Update LangGraph in `src/lib/agents/graph.ts` to add tool agent node and edges
- [ ] T074 [US3] Update AgentIndicator component to show tool execution status (e.g., "Checking weather...")
- [ ] T075 [US3] Add error handling for tool failures in Tool Agent (graceful fallback messages)

**Checkpoint**: All P1-P3 user stories work independently. Tool execution is functional.

---

## Phase 7: User Story 4 - MCP File System Operations (Priority: P4)

**Goal**: AI reads local files via MCP protocol

**Independent Test**: Run MCP filesystem server, ask "Read file /tmp/example.txt", verify AI retrieves content

**Note**: MCP integration is optional/advanced. Can be skipped if complexity is too high.

### Tests for User Story 4 ⚠️ WRITE TESTS FIRST (Red Phase)

- [ ] T076 [P] [US4] Unit test for MCP client in `tests/unit/mcp/client.test.ts` (test connection, request/response) using Vitest
- [ ] T077 [P] [US4] Unit test for MCP file tool in `tests/unit/tools/mcp-file.test.ts` (test file read via MCP) using Vitest
- [ ] T078 [US4] Integration test for MCP flow in `tests/integration/agents/graph.test.ts` (test router → tool agent → MCP execution) using Vitest

### Implementation for User Story 4 (Green Phase)

- [ ] T079 [US4] Setup MCP client in `src/lib/mcp/client.ts` (connect to MCP server, send requests)
- [ ] T080 [US4] Implement MCP file read tool in `src/lib/tools/mcp-file.ts` (use MCP client to read files)
- [ ] T081 [US4] Update Tool Agent in `src/lib/agents/tools.ts` to include MCP file tool
- [ ] T082 [US4] Update Router Agent routing logic to detect file operation requests
- [ ] T083 [US4] Add MCP server setup documentation in README.md (how to run filesystem server)
- [ ] T084 [US4] Add MCP error handling for server unavailable, access denied scenarios

**Checkpoint**: All user stories (P1-P4) work independently. MCP file operations functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T085 [P] Create comprehensive README.md with setup instructions, architecture overview, usage examples
- [ ] T086 [P] Add API documentation for `/api/chat` and `/api/ingest` routes
- [ ] T087 [P] Implement rate limiting on API routes using middleware
- [ ] T088 [P] Add comprehensive error boundaries in React components
- [ ] T089 [P] Optimize bundle size: code splitting, lazy loading for non-critical components
- [ ] T090 [US2/US3/US4] Add E2E tests for P2/P3/P4 user stories in `tests/e2e/` using Playwright (deferred from earlier phases)
- [ ] T091 Security audit: review input validation, API key handling, MCP path restrictions
- [ ] T092 Performance testing: measure response times, optimize slow queries (target <500ms p95)
- [ ] T093 Accessibility audit: WCAG 2.1 AA compliance check on chat UI
- [ ] T094 [P] Add loading skeletons for better perceived performance
- [ ] T095 [P] Add error retry mechanisms for API failures
- [ ] T096 Create deployment configuration for Vercel (vercel.json if needed)
- [ ] T097 [P] Setup Sentry error tracking integration (optional)
- [ ] T098 [P] Setup Vercel Analytics integration (optional)
- [ ] T099 Final code review and refactoring pass
- [ ] T100 Run full test suite and ensure all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP blocker
- **User Story 5 (Phase 4)**: Depends on US1 - Tightly coupled with chat functionality
- **User Story 2 (Phase 5)**: Depends on Foundational - Can run in parallel with US5 if staffed
- **User Story 3 (Phase 6)**: Depends on Foundational - Can run after US1
- **User Story 4 (Phase 7)**: Depends on US3 (tool agent infrastructure) - Optional/Advanced
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Independence

- **US1 (P1)**: Foundational - No dependencies on other stories ✅
- **US5 (P2)**: Extends US1 with persistence - Independent testable (can chat without US2/US3/US4) ✅
- **US2 (P2)**: Adds RAG - Independent testable (can retrieve docs without US3/US4) ✅
- **US3 (P3)**: Adds tools - Independent testable (can execute tools without US2/US4) ✅
- **US4 (P4)**: Adds MCP - Independent testable (can read files without US2/US3) ✅

### Within Each User Story

1. **Tests FIRST** (Red phase) - Write failing tests
2. **Get approval** - Ensure tests reflect requirements
3. **Implementation** (Green phase) - Write minimal code to pass tests
4. **Refactor** - Clean up while maintaining test coverage
5. **Checkpoint validation** - Test story independently

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T003-T012 can run in parallel (all marked [P])

**Phase 2 (Foundational)**: Tasks T014-T015, T017, T019-T021 can run in parallel (different files)

**Phase 3 (US1 Tests)**: Tasks T022-T024 can run in parallel (different test files)

**Phase 3 (US1 Implementation)**: Tasks T027-T028, T031-T032 can run in parallel

**Once Foundational completes**: US1, US2 (if US1 done), US3 (if US1 done) can be worked on by different team members in parallel

**Phase 8 (Polish)**: Tasks T085-T090, T094-T095, T097-T098 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational tasks together:
Task T014: "Define Session types in src/lib/types/session.ts"
Task T015: "Define AgentState types in src/lib/types/agent.ts"
Task T017: "Create formatting utilities in src/utils/formatting.ts"
Task T019: "Create Button component in src/components/ui/Button.tsx"
Task T020: "Create Input component in src/components/ui/Input.tsx"
Task T021: "Create Spinner component in src/components/ui/Spinner.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 5 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T021) - CRITICAL
3. Complete Phase 3: User Story 1 (T022-T041) - Basic chat with streaming
4. Complete Phase 4: User Story 5 (T042-T051) - Session persistence
5. **STOP and VALIDATE**: Test US1 + US5 independently, run E2E test (T026)
6. Deploy to staging/demo

### Incremental Delivery (Recommended)

1. **Sprint 1**: Setup + Foundational + US1 + US5 → MVP with persistent chat ✅
2. **Sprint 2**: Add US2 (RAG) → Deploy chat with knowledge retrieval ✅
3. **Sprint 3**: Add US3 (Tools) → Deploy chat with actions ✅
4. **Sprint 4**: Add US4 (MCP) if needed → Deploy advanced file operations ✅
5. **Sprint 5**: Polish (Phase 8) → Production-ready release ✅

### Parallel Team Strategy

With 3 developers:

1. **Sprint 1**: All developers work on Setup → Foundational → US1 together (foundational work)
2. **Sprint 2**: Once US1 complete:
   - Developer A: US5 (Session persistence)
   - Developer B: US2 (RAG pipeline)
   - Developer C: Write additional tests, documentation
3. **Sprint 3**:
   - Developer A: US3 (Tools)
   - Developer B: US4 (MCP - if time permits)
   - Developer C: Performance optimization, security audit
4. **Sprint 4**: All developers work on Polish phase together

---

## Test-First Workflow (TDD)

### Red-Green-Refactor Cycle

For each user story:

1. **Red Phase** ✅:
   - Write unit tests (should FAIL)
   - Write integration tests (should FAIL)
   - Get stakeholder approval on test scenarios
   - Commit failing tests

2. **Green Phase** ✅:
   - Implement minimal code to pass tests
   - Run tests repeatedly until all pass
   - Commit passing implementation

3. **Refactor Phase** ✅:
   - Clean up code (remove duplication, improve readability)
   - Ensure tests still pass
   - Commit refactored code

### Example: User Story 1 (Basic Chat)

```bash
# Red Phase
git checkout -b us1-tests
# Write T022-T026 (all tests fail initially)
git commit -m "test(us1): Add failing tests for basic chat"
# Get approval from stakeholder on test scenarios

# Green Phase
git checkout -b us1-implementation
# Implement T027-T041 (minimal code to pass tests)
# Run: npm run test -- --testPathPattern="chat" (using Vitest)
git commit -m "feat(us1): Implement basic chat with streaming"

# Refactor Phase
# Clean up code, extract utilities, improve naming
# Run: npm run test (ensure all tests still pass with Vitest)
git commit -m "refactor(us1): Clean up chat implementation"
```

---

## Notes

- **[P]** tasks = different files, no dependencies - can run in parallel
- **[Story]** label maps task to specific user story for traceability (US1, US2, US3, US4, US5)
- Each user story should be independently completable and testable
- **TDD Mandatory**: Write tests first, ensure they fail, get approval, then implement
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Constitution compliance: ≥80% unit test coverage, ≥70% integration test coverage, E2E for P1 mandatory
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Checkpoints Summary

- ✅ **After T021**: Foundation ready - all user stories can begin
- ✅ **After T041**: US1 (Basic Chat) complete - MVP testable
- ✅ **After T051**: US5 (Persistence) complete - Chat survives refreshes
- ✅ **After T064**: US2 (RAG) complete - Knowledge retrieval works
- ✅ **After T075**: US3 (Tools) complete - Action execution works
- ✅ **After T084**: US4 (MCP) complete - File operations work
- ✅ **After T100**: All features polished - Production ready

Each checkpoint should trigger independent testing and validation of the completed story before proceeding.
