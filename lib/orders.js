import { randomBytes, randomUUID } from 'node:crypto';
import { events as sampleEvents, listUpcomingEvents } from './events';

export const MAX_TICKETS_PER_ORDER = 4;
export const HOLD_DURATION_MS = 10 * 60 * 1000;

export class TicketingError extends Error {
  constructor(message, status, options = {}) {
    super(message);
    this.name = 'TicketingError';
    this.status = status;
    this.offerWaitlist = options.offerWaitlist ?? false;
  }
}

export function createOrderStore({ sourceEvents = sampleEvents, now = () => Date.now() } = {}) {
  return {
    events: new Map(sourceEvents.map((event) => [event.id, { ...event }])),
    orders: new Map(),
    tickets: new Map(),
    now,
  };
}

const store = createOrderStore();

function expireHolds(targetStore) {
  const now = targetStore.now();
  for (const order of targetStore.orders.values()) {
    if (order.status === 'held' && order.expiresAt <= now) order.status = 'expired';
  }
}

function heldSeats(targetStore, eventId) {
  return [...targetStore.orders.values()]
    .filter((order) => order.eventId === eventId && order.status === 'held')
    .reduce((total, order) => total + order.seats, 0);
}

export function getUpcomingEvents(targetStore = store) {
  expireHolds(targetStore);
  const withHolds = [...targetStore.events.values()].map((event) => ({
    ...event,
    sold: event.sold + heldSeats(targetStore, event.id),
  }));
  return listUpcomingEvents(new Date(targetStore.now()), withHolds);
}

export function startCheckout({ eventId, seats, name, email } = {}, targetStore = store) {
  expireHolds(targetStore);
  if (!Number.isInteger(seats) || seats < 1 || seats > MAX_TICKETS_PER_ORDER) {
    throw new TicketingError(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`, 400);
  }
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new TicketingError('Enter your name and a valid email address to continue.', 400);
  }

  const event = targetStore.events.get(eventId);
  if (!event || event.status !== 'published' || new Date(event.startsAt).getTime() <= targetStore.now()) {
    throw new TicketingError('This event is no longer available.', 404);
  }
  const remaining = event.capacity - event.sold - heldSeats(targetStore, eventId);
  if (remaining < seats) {
    throw new TicketingError('This event just sold out. You can join the waitlist instead.', 409, { offerWaitlist: true });
  }

  const order = {
    id: randomUUID(),
    eventId,
    eventTitle: event.title,
    seats,
    name: name.trim(),
    email: email.trim(),
    unitPriceCents: event.priceCents,
    totalCents: event.priceCents * seats,
    createdAt: targetStore.now(),
    expiresAt: targetStore.now() + HOLD_DURATION_MS,
    status: 'held',
    receipt: null,
  };
  targetStore.orders.set(order.id, order);
  return publicOrder(order);
}

function publicOrder(order) {
  return {
    id: order.id,
    eventId: order.eventId,
    eventTitle: order.eventTitle,
    seats: order.seats,
    unitPriceCents: order.unitPriceCents,
    totalCents: order.totalCents,
    createdAt: new Date(order.createdAt).toISOString(),
    expiresAt: new Date(order.expiresAt).toISOString(),
    status: order.status,
  };
}

export function settlePayment(orderId, outcome, targetStore = store) {
  expireHolds(targetStore);
  const order = targetStore.orders.get(orderId);
  if (!order) throw new TicketingError('Checkout was not found.', 404);
  if (order.status === 'expired') throw new TicketingError('Your seat hold expired. Please start checkout again.', 410);
  if (order.status === 'declined') return { order: publicOrder(order), receipt: null };
  if (order.status === 'paid') return { order: publicOrder(order), receipt: order.receipt };
  if (order.status !== 'held') throw new TicketingError('This checkout cannot be completed.', 409);
  if (outcome !== 'succeeded' && outcome !== 'declined') throw new TicketingError('Unknown payment result.', 400);

  if (outcome === 'declined') {
    order.status = 'declined';
    return { order: publicOrder(order), receipt: null };
  }

  const event = targetStore.events.get(order.eventId);
  event.sold += order.seats;
  const tickets = Array.from({ length: order.seats }, () => {
    const ticket = { id: randomUUID(), qrToken: randomBytes(16).toString('hex') };
    targetStore.tickets.set(ticket.id, { ...ticket, orderId: order.id });
    return ticket;
  });
  order.status = 'paid';
  order.receipt = {
    orderId: order.id,
    eventTitle: order.eventTitle,
    name: order.name,
    seats: order.seats,
    totalCents: order.totalCents,
    paidAt: new Date(targetStore.now()).toISOString(),
    tickets,
  };
  return { order: publicOrder(order), receipt: order.receipt };
}
