# Manpower App Constitution

## Core Principles

### I. Code Quality Excellence
Every component must demonstrate professional software engineering standards:
- **TypeScript Strict Mode**: All code must pass strict TypeScript compilation with no `any` types unless explicitly justified
- **Clean Architecture**: Clear separation of concerns between UI, business logic, and data layers
- **Self-Documenting Code**: Functions, components, and agents must have clear names and single responsibilities
- **Error Handling**: Graceful degradation with user-friendly error messages and comprehensive logging
- **Code Consistency**: Follow established patterns; use ESLint and Prettier for automated formatting

### II. Test-Driven Development (NON-NEGOTIABLE)
TDD is mandatory for all multi-agent system components:
- **Tests First**: Write failing tests before implementation for all agents, tools, and core logic
- **Red-Green-Refactor**: Strict adherence to the TDD cycle for all development
- **Coverage Requirements**: ≥90% unit test coverage for business logic, ≥70% integration coverage for agent interactions
- **Agent Testing**: Each agent must have isolated unit tests and integration tests for routing logic
- **Mock External Dependencies**: All external APIs (GLM, weather services, MCP servers) must be mocked in tests

### III. User Experience Consistency
The multi-agent interface must provide a coherent, predictable user experience:
- **Responsive Design**: Mobile-first approach with TailwindCSS; all components must work on ≥320px width
- **Loading States**: Clear feedback during agent processing, tool execution, and RAG retrieval
- **Error Communication**: User-friendly error messages that explain what happened and suggested next steps
- **Accessibility**: WCAG 2.1 AA compliance; semantic HTML, keyboard navigation, screen reader support
- **Real-time Feedback**: Smooth streaming responses with clear indication of which agent is processing

### IV. Performance First Approach
Multi-agent systems demand rigorous performance standards:
- **Response Time**: Agent routing decisions <200ms, tool execution <5s, RAG retrieval <1s
- **Memory Management**: Efficient state management; session data <1MB per active conversation
- **Bundle Optimization**: Initial load <500KB gzipped; lazy load agent-specific components
- **Caching Strategy**: Intelligent caching for RAG results, tool responses, and agent decisions
- **Monitoring**: Performance metrics collection for all agent interactions and response times

## Technical Requirements

### Multi-Agent Architecture Standards
- **State Management**: LangGraph state must be serializable and immutable
- **Agent Isolation**: Each agent must be independently testable and deployable
- **Tool Integration**: All tools must have proper error boundaries and timeout handling
- **Memory Persistence**: Session state must survive server restarts and be recoverable
- **Routing Logic**: Router agent decisions must be deterministic and auditable

### AI/ML Integration Requirements
- **LLM Configuration**: GLM-4.6 API integration with proper retry logic and fallback handling
- **RAG Pipeline**: ChromaDB vector store with embedding consistency and document versioning
- **MCP Integration**: Robust error handling for MCP server failures and communication timeouts
- **Tool Calling**: All tools must have input validation, rate limiting, and result caching
- **Conversation Context**: Maintain conversation history with context window management

## Quality Gates

### Pre-Deployment Requirements
- **All Tests Pass**: Unit, integration, and E2E tests must pass 100%
- **Performance Benchmarks**: Response time targets met under load testing
- **Security Review**: Static analysis completed with zero high-severity vulnerabilities
- **Accessibility Audit**: Automated accessibility tests pass with zero violations
- **Bundle Analysis**: Bundle size limits met with detailed analysis of any regressions

### Code Review Standards
- **Architecture Compliance**: Changes must align with multi-agent architecture patterns
- **Test Coverage**: New features must meet coverage requirements with meaningful tests
- **Performance Impact**: Any performance degradation must be justified and documented
- **Documentation**: Complex agent logic requires inline documentation and architectural diagrams
- **Security Review**: All external integrations must be reviewed for security implications

## Development Workflow

### Feature Development Process
1. **Specification**: Complete user stories with acceptance criteria in spec.md
2. **Architecture**: Technical design in plan.md with agent interaction diagrams
3. **Test Planning**: Task breakdown with test requirements for each component
4. **Implementation**: TDD cycle for each agent, tool, and UI component
5. **Integration**: End-to-end testing of complete user workflows
6. **Validation**: Performance testing and security review before completion

### Monitoring and Observability
- **Agent Performance**: Monitor routing decisions, response times, and error rates
- **User Analytics**: Track conversation flows, agent utilization, and user satisfaction
- **System Health**: Memory usage, API rate limits, and external service dependencies
- **Error Tracking**: Comprehensive error logging with context for debugging

## Governance

### Constitution Authority
This constitution supersedes all other development practices and style guides. All feature plans must include a "Constitution Check" section validating compliance.

### Amendment Process
- **Proposal**: Amendments must be documented with rationale and impact analysis
- **Review**: Technical lead approval required for all constitution changes
- **Communication**: All amendments must be communicated to the development team
- **Implementation**: Migration plans required for any breaking changes

### Compliance Verification
- **Automated Checks**: ESLint rules, TypeScript strict mode, and test coverage automation
- **Manual Review**: Code reviews must explicitly verify constitution compliance
- **Quality Metrics**: Regular audits of performance, security, and accessibility standards
- **Team Training**: Regular training sessions on constitution principles and best practices

**Version**: 1.0.0 | **Ratified**: 2025-01-07 | **Last Amended**: 2025-01-07