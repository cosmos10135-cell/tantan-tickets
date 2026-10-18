# Today's agreed scope: Story 1

The public homepage lists fictional upcoming published events, earliest first, with date, Pittsburgh time, location, USD price (or Free) and seats remaining. Started and cancelled events are excluded. No name is required.

Available events show Buy. Sold-out events show Join waitlist instead. Clicking either displays a coming-later message without changing inventory. No checkout or waitlist is implemented in this story.

The original TEST_SPEC.md's disabled Buy behavior conflicts with Story 1; the original requirements and user-approved defaults take precedence.

Automated tests in tests/story-1.test.jsx reference Story 1. AC1 covers displayed fields and server filtering/sorting/counting. AC2 covers the sold-out action replacement. Additional tests cover loading, empty, retry after error, free events, informational actions and safe text rendering (SEC-20). Tests run in a simulated browser DOM, not a real browser.

The interface uses native buttons, heading structure, a skip link, visible keyboard focus, live status messages and named color tokens. Other stories and the original full security/performance test suite are outside this demo's scope; Story 3 has a separate scope and acceptance coverage in docs/story-3.md.
