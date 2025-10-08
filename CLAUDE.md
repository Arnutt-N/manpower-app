# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15 Multi-Agent Chat Application** that implements AI-powered conversations with intelligent routing, knowledge retrieval, and tool execution capabilities. The project uses the **Specify Framework** for spec-driven development workflow.

**Core Architecture**: Multi-agent system using LangGraph with LangChain orchestration, GLM-4.6 LLM, persistent memory, RAG pipeline, and MCP integration.

## Common Development Commands

### Development Server
```bash
npm run dev          # Start Next.js dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```bash
npm test             # Run Vitest unit tests
npm run test:ui      # Run Vitest with UI
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run Playwright end-to-end tests
npm run test:e2e:ui  # Run Playwright with UI
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

### Specify Framework Scripts
*(Note: Requires PowerShell execution policy adjustment on Windows)*
```powershell
# Create new feature branch and specification
./.specify/scripts/powershell/create-new-feature.ps1 "feature description"

# Setup implementation plan for current feature
./.specify/scripts/powershell/setup-plan.ps1

# Check workflow prerequisites
./.specify/scripts/powershell/check-prerequisites.ps1 -Json
```

## Workflow Architecture

### Feature Development Lifecycle

The Specify framework follows a multi-phase workflow:

1. **Feature Specification** (`spec.md`) - User stories, acceptance criteria, and requirements
2. **Implementation Planning** (`plan.md`) - Technical context, architecture, and structure
3. **Task Generation** (`tasks.md`) - Granular implementation tasks organized by user story priority
4. **Implementation** - Code development guided by the task list

### Branch and Directory Structure

Features are organized in a numbered branch system:

```
specs/
└── ###-feature-name/           # e.g., 001-user-auth, 002-dashboard
    ├── spec.md                 # Feature specification (user stories, requirements)
    ├── plan.md                 # Implementation plan (architecture, tech stack)
    ├── tasks.md                # Task breakdown by user story
    ├── research.md             # (Optional) Research findings
    ├── data-model.md           # (Optional) Entity/data definitions
    ├── quickstart.md           # (Optional) Getting started guide
    └── contracts/              # (Optional) API contracts/interfaces
```

**Branch Naming**: Features must be on branches named `###-feature-name` (e.g., `001-user-auth`)

**Non-Git Repositories**: The framework supports repos without git by using the `SPECIFY_FEATURE` environment variable to track the current feature.

## Key Scripts

All scripts are in `.specify/scripts/powershell/` and are cross-platform (Windows/Linux/macOS).

### Core Commands

**Create New Feature**:
```powershell
./.specify/scripts/powershell/create-new-feature.ps1 "feature description"
./.specify/scripts/powershell/create-new-feature.ps1 -Json "feature description"
```
- Creates numbered feature branch (e.g., `003-feature-name`)
- Sets up feature directory structure in `specs/`
- Copies `spec-template.md` to `specs/###-feature/spec.md`
- Sets `SPECIFY_FEATURE` environment variable for non-git repos

**Setup Implementation Plan**:
```powershell
./.specify/scripts/powershell/setup-plan.ps1
./.specify/scripts/powershell/setup-plan.ps1 -Json
```
- Validates you're on a feature branch
- Creates `plan.md` from template in the current feature directory

**Check Prerequisites**:
```powershell
# For planning phase (requires spec.md, plan.md)
./.specify/scripts/powershell/check-prerequisites.ps1 -Json

# For implementation phase (also requires tasks.md)
./.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks

# Get paths only (no validation)
./.specify/scripts/powershell/check-prerequisites.ps1 -PathsOnly
```
- Validates required documentation exists
- Returns available documents and feature paths
- Used by automation to verify workflow state

### Common Functions (common.ps1)

The `common.ps1` library provides shared utilities:

- `Get-RepoRoot` - Find repository root (git or fallback to `.specify`)
- `Get-CurrentBranch` - Get current branch (checks `SPECIFY_FEATURE` env var, then git)
- `Test-HasGit` - Check if repository uses git
- `Test-FeatureBranch` - Validate branch naming convention
- `Get-FeaturePathsEnv` - Get all standard paths for current feature
- `Test-FileExists` - Check and report file existence
- `Test-DirHasFiles` - Check if directory has files

## Template System

Templates in `.specify/templates/` provide standardized structure:

- `spec-template.md` - Feature specification with user stories (Given/When/Then format)
- `plan-template.md` - Implementation plan with technical context
- `tasks-template.md` - Task breakdown organized by user story priority
- `constitution.md` - Project principles and constraints (template only, must be customized)

### User Story Organization

**Key Principle**: User stories must be **independently testable** and **prioritized** (P1, P2, P3...). Each story should represent a standalone MVP increment that can be:
- Developed independently
- Tested independently
- Deployed independently
- Demonstrated to users independently

### Task Organization

Tasks in `tasks.md` follow this structure:

**Format**: `[ID] [P?] [Story] Description`
- `[P]` - Can run in parallel (different files, no dependencies)
- `[Story]` - Which user story (US1, US2, US3...)
- Include exact file paths in task descriptions

**Phases**:
1. **Setup** - Project initialization
2. **Foundational** - Core infrastructure (BLOCKS all user stories)
3. **User Story 1-N** - Implement each story independently by priority
4. **Polish** - Cross-cutting improvements

## Path Resolution

The framework uses intelligent path resolution:

1. **Git-based**: `git rev-parse --show-toplevel` for repo root
2. **Fallback**: Search for `.git` or `.specify` markers up the directory tree
3. **Feature tracking**:
   - Git repos: Use current branch name
   - Non-git repos: Use `SPECIFY_FEATURE` environment variable or find latest numbered feature directory

## Architecture Overview

### Multi-Agent System Architecture

The application implements a sophisticated multi-agent orchestration system:

**Core Components**:
- **LangGraph State Machine**: Coordinates agent routing and state persistence
- **Router Agent**: Intelligently routes requests to appropriate specialist agents
- **Chat Agent**: Handles general conversational interactions
- **RAG Agent**: Manages knowledge retrieval and document-based responses
- **Tool Agent**: Executes external tools and APIs

**Data Flow**: User Input → Router Agent → Specialist Agent → Tool/RAG Execution → Response Synthesis → User

### Technology Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS 4.x
- **AI/Orchestration**: LangChain + LangGraph + GLM-4.6 API
- **Memory**: LangGraph persistent state + ChromaDB vector store
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Development**: TypeScript strict mode enabled

### Project Structure Patterns

This is a **Web Application** project type following the Specify framework:

```
src/app/           # Next.js App Router pages and API routes
lib/               # Core application logic (agents, memory, tools)
components/        # React UI components
tests/             # Test suites (unit, integration, E2E)
```

**Key Files for Multi-Agent System**:
- `lib/agents/graph.ts` - LangGraph state machine definition
- `lib/agents/router.ts` - Intelligent routing logic
- `lib/agents/chat.ts` - Conversational agent implementation
- `lib/agents/rag.ts` - RAG pipeline agent
- `lib/agents/tools.ts` - Tool execution agent
- `lib/memory.ts` - Session state persistence
- `lib/llm.ts` - GLM-4.6 LLM configuration
- `lib/rag/chain.ts` - RAG retrieval chain
- `lib/mcp/client.ts` - MCP integration client

## Development Guidelines

### Environment Configuration

Required environment variables:
- `GLM_API_KEY` - GLM-4.6 API access key

### Constitution-First Development

If a `constitution.md` file exists in `.specify/memory/`, it defines:
- Core development principles (e.g., Library-First, Test-First, CLI Interface)
- Technology constraints
- Quality gates
- Governance rules

All feature plans must include a "Constitution Check" section validating compliance.

### Test-Driven Development

If the constitution specifies test-first development:
1. Write tests FIRST (they should FAIL)
2. Get user approval on failing tests
3. Implement to make tests pass (Red-Green-Refactor)

Tests are **OPTIONAL** unless explicitly requested in the feature specification.

## TypeScript Configuration

**Strict Mode**: The project uses TypeScript's strict mode with additional safety checks:
- `noUncheckedIndexedAccess` - Prevents undefined access to array elements
- `noImplicitOverride` - Requires explicit override for inherited methods
- `noUnusedLocals` and `noUnusedParameters` - Prevents unused code
- `noPropertyAccessFromIndexSignature` - Enforces type-safe property access

**Path Mapping**: Use `@/*` for imports from the `src/` directory.

## Multi-Agent Implementation Notes

### Agent Development Patterns

When implementing new agents or modifying existing ones:

1. **State Management**: All agents must work with the LangGraph state schema
2. **Tool Integration**: Use LangChain tool decorators for external API calls
3. **Memory Integration**: Ensure agents properly utilize session state persistence
4. **Error Handling**: Implement graceful fallbacks for agent failures

### RAG Pipeline Development

The RAG system uses ChromaDB for vector storage:
- Document ingestion scripts should be placed in `scripts/ingest_data.ts`
- Use RecursiveCharacterTextSplitter for text processing
- Store embeddings in ChromaDB collections
- Create retrieval chains using LangChain's `createRetrievalChain`

### MCP Integration

MCP (Model Context Protocol) integration requires:
- Client implementation in `lib/mcp/client.ts`
- Tool wrappers that execute MCP actions
- Proper error handling for MCP server communication failures

### Real-time Features

The application uses Server-Sent Events (SSE) for streaming responses:
- API routes should implement SSE endpoints for real-time agent communication
- Frontend components use EventSource for consuming SSE streams
- Proper cleanup of EventSource connections is required

## Working with Claude Code

### When Starting Work

1. Identify current feature: Check git branch or `SPECIFY_FEATURE` env var
2. Read documentation: `specs/###-feature/spec.md`, `plan.md`, `tasks.md`
3. Verify prerequisites: Run `check-prerequisites.ps1 -Json`

### When Creating Features

1. Run `create-new-feature.ps1 "description"` to set up structure
2. Fill out `spec.md` with user stories and requirements
3. Run `setup-plan.ps1` to create implementation plan
4. Fill out `plan.md` with technical details and architecture
5. Generate `tasks.md` breaking down implementation by user story

### During Implementation

- Work through tasks in priority order (P1 → P2 → P3)
- Tasks marked `[P]` can be done in parallel
- Each user story should be independently completable
- Validate each story works independently before moving to next priority
- Reference exact file paths from task descriptions

### Important Constraints

- Feature branches must match pattern: `###-feature-name`
- User stories must be independently testable (not just modular)
- Tasks must specify exact file paths
- Constitution compliance must be checked and violations justified
- Tests (if required) must be written before implementation
