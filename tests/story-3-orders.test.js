import { describe, it, expect } from 'vitest';
import {
  createOrderStore,
  getUpcomingEvents,
  HOLD_DURATION_MS,
  settlePayment,
  startCheckout,
  TicketingError,
} from '../lib/orders';

const start = Date.parse('2026-10-18T16:00:00Z');
const event = {
  id: 'concert',
  title: 'Campus Concert',
  club: 'Music Club',
  startsAt: new Date(start + 86400000).toISOString(),
  location: 'Cohon Center',
  priceCents: 1200,
  capacity: 5,
  sold: 0,
  status: 'published',
};

function fixture(capacity = event.capacity) {
  let now = start;
  const store = createOrderStore({
    sourceEvents: [{ ...event, capacity }],
    now: () => now,
  });
  return { store, advance: (milliseconds) => { now += milliseconds; } };
}

function buyer(seats = 1) {
  return { eventId: 'concert', seats, name: 'Scotty Tartan', email: 'scotty@andrew.cmu.edu' };
}

describe('Story 3: server-side order handling', () => {
  it('Story 3 AC1: enforces the four-ticket cap on the server', () => {
    const { store } = fixture();
    expect(startCheckout(buyer(4), store).seats).toBe(4);
    expect(() => startCheckout(buyer(5), store)).toThrow(TicketingError);
    expect(getUpcomingEvents(store)[0].remaining).toBe(1);
  });

  it('Story 3 AC2: releases a held order when its ten-minute window expires', () => {
    const { store, advance } = fixture();
    const order = startCheckout(buyer(2), store);
    expect(getUpcomingEvents(store)[0].remaining).toBe(3);
    advance(HOLD_DURATION_MS);
    expect(getUpcomingEvents(store)[0].remaining).toBe(5);
    expect(store.orders.get(order.id).status).toBe('expired');
  });

  it('Story 3 AC3: successful simulated payment creates a receipt and unique QR ticket tokens', () => {
    const { store } = fixture();
    const order = startCheckout(buyer(2), store);
    const { receipt } = settlePayment(order.id, 'succeeded', store);
    expect(receipt.orderId).toBe(order.id);
    expect(receipt.eventTitle).toBe('Campus Concert');
    expect(receipt.totalCents).toBe(2400);
    expect(Date.parse(receipt.paidAt) - Date.parse(order.createdAt)).toBeLessThan(60000);
    expect(receipt.tickets).toHaveLength(2);
    const tokens = receipt.tickets.map((ticket) => ticket.qrToken);
    expect(tokens.every((token) => /^[a-f0-9]{32}$/.test(token))).toBe(true);
    expect(new Set(tokens).size).toBe(2);
    expect(getUpcomingEvents(store)[0].remaining).toBe(3);
  });

  it('Story 3 AC4: declined payment releases the hold and creates no tickets', () => {
    const { store } = fixture();
    const order = startCheckout(buyer(2), store);
    expect(getUpcomingEvents(store)[0].remaining).toBe(3);
    const result = settlePayment(order.id, 'declined', store);
    expect(result.receipt).toBeNull();
    expect(store.orders.get(order.id).status).toBe('declined');
    expect(store.tickets.size).toBe(0);
    expect(getUpcomingEvents(store)[0].remaining).toBe(5);
  });

  it('Story 3 AC5: a checkout that finds no seats offers the waitlist without overselling', () => {
    const { store } = fixture(1);
    startCheckout(buyer(1), store);
    let error;
    try {
      startCheckout(buyer(1), store);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(TicketingError);
    expect(error.status).toBe(409);
    expect(error.offerWaitlist).toBe(true);
    expect(getUpcomingEvents(store)[0].remaining).toBe(0);
  });
});
