# Tartan Tickets

Story 1 only: browse fictional upcoming events with date, location, USD price and seats remaining. Sold-out events replace Buy with Join waitlist. Both buttons explain that their features are coming later; they do not reserve seats, register people or take payments.

## Run locally

From this folder, run `npm install` if dependencies are missing, then `npm run dev`. Open http://localhost:3000. Stop the server with Control+C.

Run tests with `npm test`. Run the production build with `npm run build`, then serve it with `npm start`.

## Demo data and scope

The server's in-memory sample events are seeded at startup, with dates 3, 5 and 7 days ahead so the demo remains useful. Restarting the server resets those dates. Times display in America/New_York. GET /api/events excludes started, cancelled and unpublished events, orders events by start time and calculates remaining seats on the server. Responses are not cached.

No database, authentication, emails or payment service is configured. Vercel instances have separate memory. This demo does not implement shared ticket inventory or later stories.

The original three specification files remain in the project root. The requirements' Story 1 and the user's agreed defaults govern this implementation; conflicting sold-out behavior in the original test spec is superseded. See docs/story-1.md for acceptance coverage.

Next.js uses the App Router. No environment variables or external accounts are needed. For future Vercel deployment, select Next.js as the framework and use the default build settings.

## Security spec audit

`docs/SECURITY_SPEC.md` is absent; this audit uses the original `Starter Spec A - Tartan Tickets - SECURITY_SPEC.md` in the project root. It assesses today's Story 1 build, not planned features. Missing controls are not counted as satisfied simply because their related features are absent. Vercel deployment has not been completed or verified.

| Requirement | Status | Why |
| --- | --- | --- |
| SEC-1 — CMU SSO; no stored passwords | Partly | No passwords are collected or stored, but browsing is public and CMU SSO is not implemented. |
| SEC-2 — Expire sessions after 8 hours idle | Not at all | There are no user sessions, inactivity tracking or sign-in enforcement. |
| SEC-3 — HTTPS only with HSTS | Not at all | The verified local app uses HTTP; HTTPS enforcement and HSTS have not been configured or verified on a deployed site. |
| SEC-4 — Server checks role and club membership | Not at all | The public events endpoint performs no user-role or club-membership checks. |
| SEC-5 — Deny and log unauthorized cross-club access | Not at all | Events are publicly listed, and there is no cross-club authorization or access-denial logging. |
| SEC-6 — Hide another student's ticket with “not found” | Not at all | There are no ticket records, ownership checks or ticket endpoint implementing this response. |
| SEC-7 — Stripe Checkout; no card data in servers or logs | Partly | No card data is collected, but Stripe-hosted Checkout is not implemented and Buy only shows a message. |
| SEC-8 — Calculate charges on the server; ignore browser amounts | Not at all | Display prices come from server data, but there is no checkout, quantity handling or charge calculation to enforce this control. |
| SEC-9 — Verify Stripe webhook signatures; reject and log invalid ones | Not at all | No Stripe webhook endpoint, signature verification or rejection logging exists. |
| SEC-10 — Process each Stripe event ID at most once | Not at all | No Stripe event processing or duplicate-event tracking exists. |
| SEC-11 — Secrets manager; no repository keys; live keys only in production | Partly | No Stripe keys are configured in the project, but secrets-manager storage and production-only live-key controls are not implemented. |
| SEC-12 — Two approvals before redirecting club payouts | Not at all | There are no connected Stripe accounts, payout settings or approval workflow. |
| SEC-13 — Random, personal-data-free QR tokens of at least 128 bits | Not at all | No QR codes, ticket tokens or server token lookup are implemented. |
| SEC-14 — Concurrent scans check in exactly once | Not at all | No scanning, check-in records or protection against simultaneous duplicate scans exists. |
| SEC-15 — Pause excessive invalid scans and notify officers | Not at all | No scan counters, account blocking or officer notifications are implemented. |
| SEC-16 — Block excessive checkouts for 30 minutes | Not at all | No checkout counters, account blocking or reservation-hoarding controls are implemented. |
| SEC-17 — Collect only permitted purchase fields | Partly | The browsing demo collects no personal or purchase data, but there is no purchase schema enforcing the permitted fields. |
| SEC-18 — Remove attendee names and emails after 90 days | Not at all | No attendee records, event-end tracking or scheduled removal after 90 days exists; memory resets do not implement this rule. |
| SEC-19 — Restrict, limit and log attendee exports | Not at all | No attendee exports, officer authorization, export-field restrictions or export logs exist. |
| SEC-20 — Render officer-entered text as plain text | Fully | All event text currently displayed is rendered as escaped React text, and a passing test verifies a script-tag title stays plain text; officer editing and descriptions are not implemented. |
| SEC-21 — Log who, what and when for sensitive actions | Not at all | The listed sensitive actions and their structured audit-log entries are not implemented. |
| SEC-22 — Append-only, admin-only audit logs retained for one year | Not at all | No audit-log storage, edit/delete protection, admin access checks or one-year retention exists. |
