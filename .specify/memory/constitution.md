# Manpower Application Constitution

## Core Principles

### I. Quality-First Development

**Principle**: Code quality and maintainability take precedence over rapid delivery.

**Implementation**:
- All code must pass automated quality gates before merging
- Code reviews are mandatory for all changes
- Technical debt must be addressed within the same sprint it's created
- Refactoring is considered a continuous activity, not a separate phase

**Rationale**: Quality issues compound exponentially; prevention is cheaper than remediation.

**Quality Gates**:
- ✅ Static analysis: Zero linting errors, strict type checking enabled
- ✅ Complexity: Cyclomatic complexity ≤10, max nesting ≤4 levels, functions ≤50 lines
- ✅ Security: No critical/high vulnerabilities, no hardcoded secrets
- ✅ Documentation: API docs, code comments for complex logic, README updates

---

### II. Test-Driven Development (TDD)

**Principle**: Tests are written BEFORE implementation code.

**Implementation**:
1. Write failing tests first (Red phase)
2. Get user/stakeholder approval on test scenarios
3. Implement minimal code to pass tests (Green phase)
4. Refactor while maintaining test coverage (Refactor phase)
5. Tests are executable documentation of system behavior

**Test Coverage Requirements**:
- Unit Tests: ≥80% line coverage for business logic
- Integration Tests: ≥70% coverage for API endpoints and service integrations
- E2E Tests: Critical user journeys (P1 user stories) must have E2E tests

**Test Pyramid**:
```
   E2E (10%)    ← Critical user journeys only
  Integration (30%) ← API contracts, service interactions
 Unit Tests (60%) ← Business logic, utilities, components
```

**Exception Process**: Tests may be skipped ONLY when:
- Explicitly stated as optional in the feature specification
- Justified in writing with stakeholder approval
- Risk assessment documents potential impact

---

### III. User Experience Consistency

**Principle**: Every user interaction must feel cohesive, predictable, and intuitive.

**Implementation**:
- Maintain a centralized design system and component library
- All UI components must follow accessibility standards (WCAG 2.1 AA minimum)
- Consistent terminology, icons, and interaction patterns across all features
- User feedback mechanisms for every critical action
- Error messages must be actionable and user-friendly

**UX Standards**:
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first (320px+), tablet (768px+), desktop (1024px+)
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Loading States**: Skeleton screens for >500ms operations
- **Error Handling**: Actionable messages with recovery options

**Consistency Checklist**:
- [ ] Colors from defined palette only
- [ ] Typography scale adhered to
- [ ] Spacing using 8px grid system
- [ ] Icons from approved icon set
- [ ] Interaction patterns documented

**Rationale**: Consistency reduces cognitive load and builds user confidence.

---

### IV. Performance by Design

**Principle**: Performance is a feature requirement, not an afterthought.

**Implementation**:
- Performance budgets defined for every feature
- Performance testing integrated into CI/CD pipeline
- Optimization happens during development, not after
- Regular performance audits and monitoring

**Performance Budgets**:

| Metric | Target | Maximum |
|--------|--------|---------|
| **Frontend** |
| First Contentful Paint (FCP) | ≤1.0s | ≤1.5s |
| Time to Interactive (TTI) | ≤2.5s | ≤3.5s |
| Total Blocking Time (TBT) | ≤200ms | ≤300ms |
| Cumulative Layout Shift (CLS) | ≤0.1 | ≤0.25 |
| JavaScript Bundle (gzipped) | ≤200KB | ≤300KB |
| CSS Bundle (gzipped) | ≤50KB | ≤75KB |
| **Backend** |
| API Response (read) | ≤200ms | ≤500ms |
| API Response (write) | ≤500ms | ≤1000ms |
| Database Query | ≤50ms | ≤100ms |
| Server CPU Usage | ≤60% | ≤80% |
| Server Memory Usage | ≤70% | ≤85% |

**Monitoring**:
- Real User Monitoring (RUM) for actual user metrics
- Synthetic monitoring in CI/CD
- Automated alerts when performance degrades >10%

**Rationale**: Performance directly impacts user satisfaction and operational costs.

---

### V. Security by Default

**Principle**: Security is integrated at every layer, not added later.

**Implementation**:
- Authentication & authorization enforced at API level
- All user inputs validated and sanitized server-side
- Encryption in transit (TLS 1.3+) and at rest for sensitive data
- Dependency scanning and vulnerability management
- Security scanning in CI/CD pipeline

**Security Requirements**:
- **Authentication**: Secure session management, HTTP-only cookies, CSRF protection
- **Authorization**: Role-based access control (RBAC), principle of least privilege
- **Data Protection**: PII anonymized in logs, secure password hashing (bcrypt/Argon2)
- **Input Validation**: Parameterized queries (SQL injection prevention), XSS prevention (CSP headers)
- **Vulnerability Management**: Critical vulnerabilities patched within 24 hours

**Security Gates**:
- ✅ No hardcoded secrets or credentials
- ✅ SAST (Static Application Security Testing) passes
- ✅ Dependency scan: No critical/high vulnerabilities
- ✅ Authentication enforced on protected endpoints

---

## Testing Standards

### Test Organization

```
tests/
├── unit/              # 60% of tests - Business logic, utilities
│   ├── models/
│   ├── services/
│   └── lib/
├── integration/       # 30% of tests - API contracts, service interactions
│   ├── api/
│   └── services/
└── e2e/               # 10% of tests - Critical user journeys (P1 stories)
    └── journeys/
```

### Test Requirements by Layer

**Unit Tests**:
- Scope: Individual functions, classes, components
- Speed: ≤100ms per test
- Isolation: No external dependencies (databases, APIs, file system)
- Coverage: All business logic branches
- Mocking: External dependencies must be mocked

**Integration Tests**:
- Scope: API endpoints, database interactions, service integrations
- Speed: ≤5 seconds per test
- Environment: Test database/services (isolated from production)
- Coverage: All API contracts and service boundaries
- Data: Test fixtures and factories for reproducible state

**End-to-End (E2E) Tests**:
- Scope: Critical user journeys (P1 user stories)
- Speed: ≤30 seconds per test
- Environment: Staging or production-like environment
- Coverage: Happy paths and critical edge cases only
- Stability: Must be deterministic (no flaky tests)

### Test Naming Convention

```javascript
describe("[Component/Function Name]", () => {
  it("should [expected behavior] when [condition]", () => {
    // Arrange - Set up test data and conditions
    // Act - Execute the behavior being tested
    // Assert - Verify the expected outcome
  });
});
```

**Example**:
```javascript
describe("UserAuthentication", () => {
  it("should return JWT token when credentials are valid", () => {
    // Test implementation
  });

  it("should throw UnauthorizedError when password is incorrect", () => {
    // Test implementation
  });
});
```

---

## Code Organization & Architecture

### Project Structure

```
manpower-app/
├── src/                    # Source code
│   ├── models/            # Data models and schemas
│   ├── services/          # Business logic layer
│   ├── api/               # API routes and controllers
│   ├── cli/               # Command-line interface (if applicable)
│   └── lib/               # Shared utilities and helpers
├── tests/                 # Test suites
│   ├── unit/             # Unit tests (60%)
│   ├── integration/      # Integration tests (30%)
│   └── e2e/              # End-to-end tests (10%)
├── docs/                  # Documentation
├── specs/                 # Feature specifications (Specify framework)
└── .specify/             # Specify framework configuration
```

### Architectural Principles

**1. Separation of Concerns**:
- **Models**: Data structure and validation only
- **Services**: Business logic, no HTTP concerns
- **Controllers/API**: HTTP request/response handling, thin layer
- **Utilities**: Pure functions, no side effects

**2. Dependency Injection**:
- Services receive dependencies via constructor
- Testability through mockable dependencies
- Avoid global state and singletons

**3. Error Handling Strategy**:
- **Domain Errors**: Custom error classes for business logic
- **Error Boundaries**: Centralized error handling middleware
- **Logging**: Structured logging with correlation IDs
- **User-Facing Errors**: Generic messages (no stack traces to users)

**4. API Design Principles**:
- **RESTful Design**: Follow REST conventions (GET, POST, PUT, DELETE)
- **Versioning**: API versioning via URL path (`/api/v1/`)
- **Pagination**: Default pagination for list endpoints
- **Filtering & Sorting**: Query parameters for filtering/sorting
- **Rate Limiting**: Per-user rate limits to prevent abuse

---

## Development Workflow

### Branch Strategy

**Specify Framework Workflow**:
- **Main Branch**: Production-ready code only
- **Feature Branches**: `###-feature-name` (e.g., `001-user-auth`)
- **Hotfix Branches**: `hotfix-###-description` for urgent production fixes

### Code Review Requirements

All code changes require:
- [ ] Automated tests pass (unit, integration, E2E)
- [ ] Code coverage meets thresholds (≥80% unit, ≥70% integration)
- [ ] Linting and type checking pass
- [ ] Security scan passes (no critical/high vulnerabilities)
- [ ] At least one peer review approval
- [ ] Documentation updated (if applicable)
- [ ] Performance budget not exceeded

### Definition of Done (DoD)

A feature is considered complete when:
- [ ] All acceptance criteria met (from `spec.md`)
- [ ] All tasks completed (from `tasks.md`)
- [ ] Tests written and passing (unit, integration, E2E for P1 stories)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Deployed to staging and validated
- [ ] Product owner acceptance obtained

---

## Constitution Compliance

### Constitution Check (Required in Every `plan.md`)

Every feature implementation plan must include a "Constitution Check" section:

```markdown
## Constitution Check

| Principle | Compliance | Notes |
|-----------|------------|-------|
| Quality-First Development | ✅ Compliant | Automated quality gates configured in CI |
| Test-Driven Development | ⚠️ Partial | E2E tests deferred to P2 (approved by PO) |
| UX Consistency | ✅ Compliant | Design system components used throughout |
| Performance by Design | ✅ Compliant | Performance budgets defined and monitored |
| Security by Default | ✅ Compliant | Authentication enforced, inputs validated |

**Violations**: [Describe any violations and their justification]
**Risks**: [Document risks associated with any deviations]
**Mitigation**: [Describe how risks will be managed]
```

### Exception Process

Deviations from this constitution require:
1. **Written Justification**: Why the deviation is necessary
2. **Risk Assessment**: Potential impact of the deviation
3. **Mitigation Plan**: How risks will be managed
4. **Stakeholder Approval**: Product owner and tech lead sign-off
5. **Time-Boxing**: Temporary exceptions must have an end date and remediation plan

---

## Key Performance Indicators (KPIs)

### Quality Metrics
- **Defect Density**: Defects per 1,000 lines of code (target: <1)
- **Mean Time to Resolution (MTTR)**: Average time to fix bugs (target: <24 hours for critical, <7 days for non-critical)
- **Code Coverage**: Percentage of code covered by tests (target: ≥80%)
- **Code Review Turnaround**: Time from PR creation to merge (target: <24 hours)

### Performance Metrics
- **Lighthouse Score**: Google Lighthouse performance score (target: ≥90)
- **Core Web Vitals**: All metrics in "good" range (FCP, TTI, CLS)
- **API Latency**: P95 response time (target: ≤500ms for reads, ≤1000ms for writes)
- **Error Rate**: Percentage of requests resulting in errors (target: <0.1%)

### User Experience Metrics
- **Task Success Rate**: Percentage of users completing primary tasks (target: ≥90%)
- **User Satisfaction Score (CSAT)**: Post-task satisfaction rating (target: ≥4.5/5)
- **Accessibility Violations**: Automated accessibility issues (target: 0 critical violations)

### Security Metrics
- **Vulnerability Remediation Time**: Time to patch critical vulnerabilities (target: <24 hours)
- **Security Scan Findings**: Number of vulnerabilities detected (target: 0 critical/high)

---

## Governance

### Constitution Authority
- This constitution supersedes all other development practices
- All pull requests and code reviews must verify compliance
- Violations must be documented and justified in feature plans

### Amendment Process

This constitution can be amended by:
1. Proposing changes with rationale and impact analysis
2. Team discussion and consensus
3. Stakeholder approval (product owner, tech lead)
4. Documentation of decision and reasoning
5. Version increment and date update

### Continuous Improvement

- **Retrospectives**: Bi-weekly team retrospectives to identify improvements
- **Metrics Review**: Monthly review of all KPIs and trends
- **Learning Sessions**: Weekly knowledge-sharing sessions
- **Constitution Review**: Quarterly review of constitution effectiveness

---

**Version**: 1.0.0 | **Ratified**: 2025-10-07 | **Last Amended**: 2025-10-07

---

## Conclusion

This constitution represents our commitment to building a high-quality, performant, accessible, and secure manpower application. All team members are responsible for upholding these principles and holding each other accountable.

**Remember**: These principles exist to serve our users. When in doubt, ask: "Does this decision improve the user experience while maintaining our quality standards?"
