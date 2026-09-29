# Contributing to PulseLayer

PulseLayer is an early-stage public-good project for transparent Stellar account analysis. Contributions are evaluated on correctness, reproducibility, security, user value, and how clearly a reviewer can verify the change.

The project welcomes code, documentation, research, evaluation datasets, bug reports, and responsible challenge to the scoring assumptions. A contribution does not need to promote the score; showing where the model fails is valuable work.

## Before opening an issue

Search existing issues and pull requests first. A useful issue includes:

- the problem and affected user or ecosystem workflow
- expected and observed behavior
- reproduction steps or a minimal example
- environment details and relevant logs
- security, privacy, or data-provenance implications

For scoring or data changes, include the account or fixture characteristics needed to reproduce the result. Do not publish private keys, secret seeds, personal data, or undisclosed vulnerability details.

## Development

```bash
git clone https://github.com/Justice989810/Pulse-Layer.git
cd Pulse-Layer
npm install
npm run dev
```

Use a focused branch such as `feature/scoring-evaluation`, `fix/horizon-reconnect`, or `docs/api-contract`.

Available checks:

```bash
npm run lint
npm run build
```

Run the narrowest relevant check while iterating. Changes that affect the server should also be exercised against `/api/stats`; changes to scoring should include representative inputs and expected outputs in the pull request. The development seed includes generated fixtures, so distinguish fixture validation from claims about live Stellar data.

## Engineering standards

### Data and scoring

- Keep scoring deterministic, bounded, and explainable.
- Update the executable scoring logic and its documentation together.
- Separate observed Horizon data, derived metrics, and generated fixtures.
- Treat scores as screening signals, never as identity, fraud, credit, or compliance verdicts.
- Describe false-positive, false-negative, and data-availability risks.

### Backend and security

- Use prepared statements for SQLite queries.
- Validate account identifiers and query parameters at the boundary.
- Preserve the read-only, non-custodial model.
- Avoid logging secrets or unnecessary account data.
- Update [`SECURITY.md`](SECURITY.md) when security assumptions change.

### Frontend and accessibility

- Keep account evidence understandable to non-specialist reviewers.
- Preserve responsive behavior, keyboard access, and clear loading/error states.
- Avoid presenting a score without its relevant context and limitations.

### Documentation

Update documentation in the same pull request when behavior, API contracts, deployment, architecture, security, or roadmap commitments change. Prefer concrete examples and acceptance criteria over marketing language.

## Pull requests

Every substantive change should use a focused pull request. The description should answer:

1. What problem does this solve?
2. What changed and what is deliberately out of scope?
3. How was it verified?
4. What evidence, data, or assumptions does it rely on?
5. What risks, limitations, or follow-up work remain?

Before requesting review:

- [ ] the branch contains only related changes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes when applicable
- [ ] behavior was checked with a focused command or reproducible example
- [ ] documentation and API details are current
- [ ] no secrets, credentials, or unlicensed data were added
- [ ] security and data-provenance implications are stated

Suggested description:

```md
## Problem

## Change

## Public or ecosystem value

## Verification
- `npm run lint`
- `npm run build`
- focused manual or data check

## Limitations and follow-up
```

## Review and decision making

Reviewers should prioritize correctness, reproducibility, security, accessibility, maintainability, and measurable ecosystem value. Review comments should be specific and actionable. Maintainers may request a smaller scope, additional evidence, or a documentation change before merging.

Roadmap work is prioritized by public usefulness, evidence quality, reliability, contributor accessibility, and available maintenance capacity. Funding or grant alignment never replaces technical review.

## Security reporting

Do not open a public issue for an exploitable vulnerability. Follow [`SECURITY.md`](SECURITY.md) and provide affected components, reproduction steps, impact, and a suggested mitigation where possible. Remove secrets from logs and examples before sharing them.

## License

By contributing, you agree that your contribution is provided under the repository's [MIT License](LICENSE).
