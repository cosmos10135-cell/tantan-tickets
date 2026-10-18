import { describe, expect, it } from 'vitest';
import { POST } from '../app/api/orders/route';
import { POST as completeOrder } from '../app/api/orders/[id]/complete/route';

describe('SEC-8: server-authoritative simulated order totals', () => {
  it('The server ignores browser-submitted prices and totals.', async () => {
    const response = await POST(new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'concert',
        seats: 2,
        name: 'Scotty Tartan',
        email: 'scotty@andrew.cmu.edu',
        priceCents: 1,
        unitPriceCents: 1,
        totalCents: 1,
      }),
    }));

    expect(response.status).toBe(201);
    const { order } = await response.json();
    expect(order.unitPriceCents).toBe(1200);
    expect(order.totalCents).toBe(2400);

    const completion = await completeOrder(new Request(`http://localhost/api/orders/${order.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceCents: 1, unitPriceCents: 1, totalCents: 1 }),
    }), { params: Promise.resolve({ id: order.id }) });
    expect(completion.status).toBe(200);
    const { receipt } = await completion.json();
    expect(receipt.totalCents).toBe(2400);
  });
});
