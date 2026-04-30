# feloopsportal — Status

> Last updated: 2026-04-30
> See [program dashboard](https://github.com/RizwanZafaris/felo-docs/blob/main/STATUS.md).

## Purpose
Web operations portal for FELO. Next.js 14 + shadcn/ui + Supabase Auth (WebAuthn for admin MFA).

## Owner squad
Ops Portal.

## Current head
- branch: `main`
- last commit: scaffold initial commit
- log: https://github.com/RizwanZafaris/feloopsportal/commits/main

## Dashboards (planned by week)

| Week | Slice | State |
|---|---|---|
| 1 | Auth (WebAuthn) + admin_users + audit_log + Overview | not started |
| 2 | User Management + Traceability Center | not started |
| 3 | Bank/SMS Routes + Remittance Ops | not started |
| 4 | Subscription & Billing + Coupons + Compliance | not started |
| 5 | Coach Ops + Notification & Engagement Studio | not started |
| 6 | Feature Flags + Analytics & Finance + Audit Viewer + hardening | not started |

## Active PRs
_none yet_

## Build & test gates

| Gate | Target | Last check |
|---|---|---|
| `pnpm build` | green | scaffold |
| `pnpm test` coverage | ≥ 60% | 0% |
| Playwright e2e on destructive actions | 100% | 0% |

## How to update
- Ops Portal squad-lead: update slice state weekly.
- All edits via PR; only Claude Code merges to `main`.
