# Local complaint API

The Vite development server mounts `/api/*` from `server/api.mjs`. Records persist to `.data/monitor.json` (or `AICTE_DATA_FILE`). The store seeds clearly fictional records on first use. It is a local single-process store for this prototype, not a shared or production database.

Set `AICTE_BOOTSTRAP_EMAIL` and `AICTE_BOOTSTRAP_PASSWORD` before starting Vite to provision the first Super Admin. The password must be at least 12 characters and contain a number and symbol. `AICTE_BOOTSTRAP_NAME` is optional. Bootstrap runs once, only when no Super Admin exists. Never commit these environment values. New signup requests are inactive Bureau Officer accounts until a Super Admin approves them.

`AICTE_REMINDER_DAYS` sets the local approaching-deadline alert window (default 7, allowed range 1–90 days); it is a configurable prototype reminder and does not assert an official AICTE SLA.

The API hashes passwords with Node scrypt, uses an HttpOnly SameSite session cookie, enforces role and record scope checks, validates case status transitions, records append-only audit entries, detects same-institution cross-Bureau candidates for human review, and provides permission-filtered CSV exports. Set `AICTE_COOKIE_SECURE=true` when serving over HTTPS. The standalone API can be run with `pnpm api`; it listens on `127.0.0.1:8787` by default.

Still requiring deployment configuration: a shared transactional database, HTTPS cookie configuration, email/OTP delivery, and secure document storage. Do not use this JSON file store as a multi-user production database.
