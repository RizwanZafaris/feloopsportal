# Claude Code notes — feloopsportal

This is the **Next.js admin portal** for Felo. One of three repos.
The canonical project-wide handoff is at:

    /Users/rizwanzafar/Desktop/Felo_Project/FELO_HANDOFF.md

…if available.

## Active branch

`soft-launch/v1` — adds the `/launch-readiness` page that's the
operational driver for the soft-launch checklist.

## Source of truth

| Topic | Read |
|---|---|
| Routes | `app/*/page.tsx` (App Router) |
| Launch-readiness page | `app/launch-readiness/page.tsx` |
| API client | `lib/api.ts` (108+ functions) |
| Type contracts | `types/admin.ts` |
| Auth (WebAuthn) | `lib/auth.ts` |
| RBAC | `lib/rbac.ts`, `lib/admin/rbac.ts` |
| Sidebar nav | `components/ui/sidebar.tsx` |
| Vercel deployment config | `vercel.json` |

## Conventions

- The portal is a **client of** `appbackendfelo` — never persist data
  here directly. All writes go through `/admin/*` API endpoints.
- WebAuthn RP ID is locked to `feloopsportal.vercel.app`. Changing
  it breaks every existing admin credential. Do NOT change without
  re-enrol plan.
- `NEXT_PUBLIC_*` env vars are visible in the browser bundle — only
  put genuinely public values there.
- Never paste service-role Supabase keys into Next env. The portal
  reads via the backend's admin API only.

## Live infrastructure

- Vercel URL: `https://feloopsportal.vercel.app`
- Backend it talks to: `https://appbackendfelo-production.up.railway.app/v1`

## Quick-validate

```bash
npm install --no-audit --no-fund
npx --no-install tsc --noEmit
npm run build
```

## Known follow-ups

- Wire all 24+ admin endpoints (incidents, support, traceability) to
  real backend handlers as money modules return.
- Replace legacy `x-admin-id` admin auth with full WebAuthn flow on
  the backend side.
- Add Playwright e2e tests for destructive actions (kill-switch,
  refund, status-changes).
