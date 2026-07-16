# Ariadne

Ariadne is a repository intelligence platform for exploring legacy software through deterministic parsing, architecture graphs, search, and grounded AI-ready context.

## Codex and GPT-5.6

Codex and GPT-5.6 were used throughout the development of Ariadne as an engineering and product-design collaborator.

- Designed the feature-oriented architecture and clean module boundaries for repository import, parsing, graph construction, analysis, knowledge, retrieval, AI, settings, and background jobs.
- Implemented strongly typed TypeScript domain contracts, Prisma persistence models, API routes, validation, and reusable React components.
- Helped build the deterministic language-intelligence foundation, including the universal AST model, language-plugin contract, parser registry, and TypeScript/JavaScript compiler API integration.
- Created the repository workspace, knowledge explorer, architecture graph, Ariadne Thread interaction, global search, dashboard, design system, and motion primitives.
- Defined grounded-AI safeguards so provider responses are repository-scoped, citation-backed, and rejected when retrieved knowledge is insufficient.
- Assisted with test and type-check remediation, documentation, UI copy, and developer workflow guidance.

Codex/GPT-5.6 accelerated implementation and iteration, but Ariadne’s repository understanding is designed to remain deterministic: canonical facts originate from import, parsing, symbol extraction, relationships, graph construction, metrics, and indexed knowledge—not from an LLM.

## Local development

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL, then:
npx prisma db push
npx prisma generate
npm run dev
```

For encrypted AI-provider configuration, set `SETTINGS_ENCRYPTION_KEY` to a base64-encoded 32-byte key.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
