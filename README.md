# feloopsportal

FELO Operations Portal — web admin/back-office used by support, finance, growth, and compliance teams to run FELO.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Recharts
- Playwright for e2e
- Auth: Supabase + WebAuthn for admin MFA

## Talks to

- `appbackendfelo` admin API surface (`/admin/v1/*`)
- Postgres read-replica for heavy analytics queries

## Scripts

```bash
pnpm dev        # local dev
pnpm build      # production build
pnpm test       # unit tests
pnpm test:e2e   # Playwright
pnpm lint       # eslint
```

## Branch model

- Work on `feat/<squad>-<story-id>` branches
- Open PR, label `ready-for-claude-final-review` when reviewed
- Only Claude Code merges to `main`

## Structure (planned)

```
apps/portal/
  app/                    # Next.js routes
  components/             # shadcn-extended UI
  lib/                    # api client, auth, query keys
  styles/
tests/
  e2e/                    # Playwright
docs/
  runbooks/
```
