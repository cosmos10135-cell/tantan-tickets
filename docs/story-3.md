# Today's agreed scope: Story 3

Story 3 adds an in-memory simulated ticket purchase flow to Story 1.

- A buyer may hold 1–4 seats for ten minutes. The server calculates totals from the event's stored price and rejects quantities above four.
- Checkout asks for a typed name and CMU email instead of requiring university SSO.
- Successful simulated payment displays an on-screen receipt with one random QR ticket code per seat. No real payment or email is sent.
- A declined payment releases the hold and creates no tickets. Decline is exercised in server tests, not offered as a choice in the buyer interface.
- If seats are no longer available when checkout starts, the buyer is offered the waitlist. Joining it is not part of Story 3.
- Orders, holds, and tickets are held in server memory. They reset when the server restarts and are not shared between Vercel instances.

## Acceptance coverage

Automated tests in `tests/story-3.test.jsx` cover checkout quantity validation, the ten-minute hold message, the on-screen receipt and QR image, declined payment feedback, and the waitlist offer when seats are gone. `tests/story-3-orders.test.js` covers the server-side order cap, actual hold expiry, unique 128-bit QR tokens and receipt timing, release after a declined payment, and preventing overselling when the last seat is held.

`tests/security-sec-8.test.js` verifies at the API boundary that forged client price and total fields do not override the server-calculated order amount.

This is a class demo, not production checkout. It does not implement real payments, email delivery, persistent inventory, authentication, or waitlist enrollment.
