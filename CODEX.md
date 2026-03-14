# Codex Project Conventions

Use this repository with the following defaults:

- Prefer editing existing files over creating parallel alternatives.
- Keep code changes scoped and production-oriented.
- Use feature-based organization:
  - `app/` routing and page composition
  - `components/` UI layers
  - `actions/` server actions
  - `lib/services/` business logic
  - `lib/supabase/` data clients
- Validate with:
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`

Load and follow skill files under `.codex/skills/*/SKILL.md` before implementing related work.
