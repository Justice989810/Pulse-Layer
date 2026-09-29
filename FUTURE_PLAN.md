# PulseLayer Future Plan

This is a delivery plan, not a promise of grant approval. It keeps PulseLayer focused on a public-good problem: making Stellar account behavior easier to inspect with open, reproducible, and clearly limited tooling.

## Current baseline

PulseLayer currently provides a TypeScript scoring engine, Horizon-backed account lookup, a SQLite index, REST and WebSocket interfaces, a Next.js dashboard, and deployment configurations. The score is a deterministic heuristic. The seed dataset includes generated development fixtures, so the next stage must improve provenance and evaluation before the system is used for consequential decisions.

## Outcomes

The roadmap is successful when a new user can:

- inspect why an account received a score
- distinguish observed data from derived metrics and fixtures
- reproduce a result locally
- export evidence for a human review
- understand the model's uncertainty and failure modes
- integrate the API without relying on private keys or opaque services

## Milestones

### M1: Reproducible evaluation and model transparency

Deliverables:

- versioned scoring fixtures covering ordinary, sparse, bursty, failed-operation, and missing-data accounts
- automated tests for score bounds, signal deltas, thresholds, and risk-band transitions
- a model card documenting intended use, non-goals, assumptions, known bias, and limitations
- provenance fields that identify live Horizon data, derived values, and generated fixtures

Acceptance evidence:

- a clean checkout can run the evaluation command and reproduce the documented outputs
- every score in the evaluation report can be traced to input fields and source type
- a reviewer can identify at least one known false-positive and false-negative scenario

### M2: Ingestion reliability and data quality

Deliverables:

- Horizon retry and backoff behavior with observable failure states
- deduplication and idempotent indexing for ledgers, operations, and transactions
- explicit handling for unavailable, unfunded, malformed, or stale account data
- health metrics for ingestion lag, reconnects, records processed, and rejected records

Acceptance evidence:

- controlled interruption and restart tests show no silent data corruption
- the API reports data freshness and source status
- ingestion errors are actionable without exposing internal secrets or stack traces

### M3: API and deployment hardening

Deliverables:

- documented API response contracts and input limits
- rate limiting or a documented deployment-layer equivalent
- configurable CORS, health checks, structured logs, and backup guidance
- production deployment runbooks for the supported hosting paths

Acceptance evidence:

- API behavior is covered by smoke tests for success, invalid input, missing account, and upstream failure
- a new operator can deploy the server and dashboard from the documented steps
- the SQLite backup and restore path is tested and documented

### M4: Ecosystem usability and feedback

Deliverables:

- an account investigation workflow that shows score, signals, source freshness, and history together
- stable JSON export documentation and a small integration example
- feedback from Stellar builders, analysts, and wallet or explorer teams
- a public changelog of model and API changes

Acceptance evidence:

- at least three independent reviewers can complete the investigation workflow without maintainer assistance
- feedback is recorded with decisions and follow-up issues
- breaking API or scoring changes include migration notes

### M5: Sustainable open-source operation

Deliverables:

- maintainer and release responsibilities
- issue triage labels and a lightweight decision record format
- contributor onboarding improvements and recurring health checks
- quarterly impact reports covering usage, reliability, evaluation results, and unresolved risks

Acceptance evidence:

- a contributor can reproduce the project from the README and submit a validated change
- releases publish verification evidence and known limitations
- project health is measured with public, non-sensitive metrics rather than inflated claims

## Funding use and public outputs

Potential funding from Stellar ecosystem programs, Drips-style public-good rounds, Grantfox, or other grant makers would be tied to the milestones above. The highest-leverage uses are engineering time for data quality and reliability, evaluation infrastructure, documentation, community testing, and modest hosting costs.

Each funded work package should publish:

- a scope and baseline
- a named owner or accountable maintainer
- a delivery date or review window
- the code, report, dataset schema, or runbook produced
- verification results and unresolved limitations

Funding alignment is an objective, not an eligibility claim. Programs differ in criteria, geography, timing, application format, and definitions of public goods; those requirements must be checked at submission time.

## Non-goals

PulseLayer will not become a custodial product, a private-key service, an opaque blacklist, or an automated replacement for legal, compliance, or human judgment. It will not describe a heuristic score as proof that an account or person is trustworthy.

## Governance and prioritization

Until a larger maintainer group exists, decisions are made through issues and pull requests. Priority goes to work that improves public usefulness, evidence quality, security, reliability, accessibility, or contributor independence. Model changes require an explanation of the affected signals and expected behavior; API changes require contract and migration notes.

## How progress is reported

Each milestone update should include completed deliverables, commands or tests run, links to artifacts, current metrics, known limitations, and the next decision needed. This makes progress legible to users, contributors, grant reviewers, and automated repository analysis without substituting polished language for evidence.
