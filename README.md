# Tartan Tickets

Stories 1 and 3: browse fictional upcoming events, then place a simulated ticket order. Available events show date, location, USD price and seats remaining; sold-out events offer a waitlist link. Checkout holds up to four seats for ten minutes. A successful simulated payment shows an on-screen receipt with QR ticket codes. No real payments, email receipts, or waitlist registration are performed.

## Run locally

From this folder, run `npm install` if dependencies are missing, then `npm run dev`. Open http://localhost:3000. Stop the server with Control+C.

Run tests with `npm test`. Run the production build with `npm run build`, then serve it with `npm start`.

## Demo data and scope

The server's in-memory sample events are seeded at startup, with dates 3, 5 and 7 days ahead so the demo remains useful. Restarting the server resets those dates, orders, tickets, and seat holds. Times display in America/New_York. GET /api/events excludes started, cancelled and unpublished events, orders events by start time and calculates remaining seats on the server, including active holds. Responses are not cached.

There is no database, real authentication, email service, or payment provider. Buyers enter a name and CMU email as demo data; no card details are requested. Payment success and QR tickets are simulated. A server-side declined-payment path is covered by tests but is not offered as a buyer choice. On Vercel, each instance has separate memory, so holds and inventory are not shared between instances. This demo does not implement shared ticket inventory or later stories.

The three specifications are in `docs/`. Story 1 follows its agreed defaults where the original test spec conflicts; Story 3 uses simulated payment and typed buyer details instead of real services. See docs/story-1.md and docs/story-3.md for scope and acceptance coverage.

Next.js uses the App Router. No environment variables or external accounts are needed. For future Vercel deployment, select Next.js as the framework and use the default build settings.

## Security spec audit

This audit uses `docs/Starter Spec A - Tartan Tickets - SECURITY_SPEC.md` and assesses the current Story 1 and Story 3 code, not planned features. Missing controls are not counted as satisfied simply because their related features are absent. Vercel-specific security headers and deployment settings are not audited here.

| Requirement | Status | Why |
| --- | --- | --- |
| SEC-1 — CMU SSO; no stored passwords | Partly | No passwords are collected or stored, but browsing is public and CMU SSO is not implemented. |
| SEC-2 — Expire sessions after 8 hours idle | Not at all | There are no user sessions, inactivity tracking or sign-in enforcement. |
| SEC-3 — HTTPS only with HSTS | Not at all | The verified local app uses HTTP; HTTPS enforcement and HSTS have not been configured or verified on a deployed site. |
| SEC-4 — Server checks role and club membership | Not at all | The public events endpoint performs no user-role or club-membership checks. |
| SEC-5 — Deny and log unauthorized cross-club access | Not at all | Events are publicly listed, and there is no cross-club authorization or access-denial logging. |
| SEC-6 — Hide another student's ticket with “not found” | Not at all | There are no ticket records, ownership checks or ticket endpoint implementing this response. |
| SEC-7 — Stripe Checkout; no card data in servers or logs | Partly | The demo collects no card data and does not connect to Stripe; payments are simulated. |
| SEC-8 — Calculate charges on the server; ignore browser amounts | Fully for simulated totals | The server calculates the simulated order and receipt total from its stored event price and seat count; a passing API test proves browser-supplied amounts are ignored. A real payment charge is not implemented because there is no payment provider. |
| SEC-9 — Verify Stripe webhook signatures; reject and log invalid ones | Not at all | No Stripe webhook endpoint, signature verification or rejection logging exists. |
| SEC-10 — Process each Stripe event ID at most once | Not at all | No Stripe event processing or duplicate-event tracking exists. |
| SEC-11 — Secrets manager; no repository keys; live keys only in production | Partly | No Stripe keys are configured in the project, but secrets-manager storage and production-only live-key controls are not implemented. |
| SEC-12 — Two approvals before redirecting club payouts | Not at all | There are no connected Stripe accounts, payout settings or approval workflow. |
| SEC-13 — Random, personal-data-free QR tokens of at least 128 bits | Partly | Successful simulated orders receive unique random 128-bit QR tokens stored in server memory; scanning and token lookup are not implemented. |
| SEC-14 — Concurrent scans check in exactly once | Not at all | No scanning, check-in records or protection against simultaneous duplicate scans exists. |
| SEC-15 — Pause excessive invalid scans and notify officers | Not at all | No scan counters, account blocking or officer notifications are implemented. |
| SEC-16 — Block excessive checkouts for 30 minutes | Not at all | No checkout counters, account blocking or reservation-hoarding controls are implemented. |
| SEC-17 — Collect only permitted purchase fields | Partly | Simulated orders keep the buyer's name and email with in-memory order and ticket status; no database, Stripe payment ID, or retention workflow is implemented. |
| SEC-18 — Remove attendee names and emails after 90 days | Not at all | No attendee records, event-end tracking or scheduled removal after 90 days exists; memory resets do not implement this rule. |
| SEC-19 — Restrict, limit and log attendee exports | Not at all | No attendee exports, officer authorization, export-field restrictions or export logs exist. |
| SEC-20 — Render officer-entered text as plain text | Fully | All event text currently displayed is rendered as escaped React text, and a passing test verifies a script-tag title stays plain text; officer editing and descriptions are not implemented. |
| SEC-21 — Log who, what and when for sensitive actions | Not at all | The listed sensitive actions and their structured audit-log entries are not implemented. |
| SEC-22 — Append-only, admin-only audit logs retained for one year | Not at all | No audit-log storage, edit/delete protection, admin access checks or one-year retention exists. |
