import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import EventBrowser from '../components/EventBrowser';

const event = {
  id: 'concert',
  title: 'Campus Concert',
  club: 'Music Club',
  startsAt: '2026-10-20T23:00:00Z',
  location: 'Cohon Center',
  priceCents: 1200,
  remaining: 5,
  category: 'Music',
};

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function startCheckout(events = [event]) {
  const loadEvents = vi.fn().mockResolvedValue(events);
  render(<EventBrowser loadEvents={loadEvents} />);
  return loadEvents;
}

async function openCheckout() {
  fireEvent.click(await screen.findByRole('button', { name: 'Buy' }));
  return screen.findByRole('dialog', { name: /checkout/i });
}

async function fillBuyer(dialog, quantity = '1') {
  fireEvent.change(within(dialog).getByLabelText('Number of tickets'), { target: { value: quantity } });
  fireEvent.change(within(dialog).getByLabelText('Full name'), { target: { value: 'Scotty Tartan' } });
  fireEvent.change(within(dialog).getByLabelText('CMU email'), { target: { value: 'scotty@andrew.cmu.edu' } });
}

describe('Story 3: Buy tickets', () => {
  it('Story 3 AC1: allows a buyer to select four tickets and caps the field at four', async () => {
    startCheckout();
    const dialog = await openCheckout();
    const quantity = within(dialog).getByLabelText('Number of tickets');
    expect(quantity).toHaveAttribute('max', '4');
    await fillBuyer(dialog, '4');
    global.fetch = vi.fn().mockResolvedValue(response({
      order: { id: 'order-1', seats: 4, totalCents: 4800, expiresAt: new Date(Date.now() + 600000).toISOString() },
    }, 201));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold seats' }));
    expect(await screen.findByText(/4 seats are held/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        eventId: 'concert',
        seats: 4,
        name: 'Scotty Tartan',
        email: 'scotty@andrew.cmu.edu',
      }),
    }));
  });

  it('Story 3 AC2: holds seats for ten minutes after checkout starts', async () => {
    startCheckout();
    const dialog = await openCheckout();
    await fillBuyer(dialog, '2');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    global.fetch = vi.fn().mockResolvedValue(response({
      order: { id: 'order-1', seats: 2, expiresAt },
    }, 201));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold seats' }));
    expect(await screen.findByText(/2 seats are held for 10 minutes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete simulated payment' })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'POST' }));
  });

  it('Story 3 AC3: successful simulated payment shows an on-screen receipt with a QR code', async () => {
    startCheckout();
    const dialog = await openCheckout();
    await fillBuyer(dialog);
    global.fetch = vi.fn()
      .mockResolvedValueOnce(response({ order: { id: 'order-1', seats: 1, expiresAt: new Date(Date.now() + 600000).toISOString() } }, 201))
      .mockResolvedValueOnce(response({
        receipt: {
          orderId: 'order-1',
          eventTitle: 'Campus Concert',
          seats: 1,
          totalCents: 1200,
          tickets: [{ id: 'ticket-1', qrToken: 'a'.repeat(32) }],
        },
      }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold seats' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Complete simulated payment' }));
    expect(await screen.findByRole('heading', { name: 'Purchase complete' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /ticket qr code/i })).toBeInTheDocument();
    expect(screen.getByText(/Simulated receipt for Campus Concert/)).toBeInTheDocument();
  });

  it('Story 3 AC4: a declined payment releases held seats and issues no tickets', async () => {
    const loadEvents = startCheckout();
    const dialog = await openCheckout();
    await fillBuyer(dialog, '2');
    global.fetch = vi.fn()
      .mockResolvedValueOnce(response({ order: { id: 'order-1', seats: 2, expiresAt: new Date(Date.now() + 600000).toISOString() } }, 201))
      .mockResolvedValueOnce(response({ error: 'Simulated payment declined. Held seats have been released.' }, 402));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold seats' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Complete simulated payment' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/payment declined/i);
    await waitFor(() => expect(loadEvents).toHaveBeenCalledTimes(3));
    expect(await screen.findByText('5 seats remaining')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Purchase complete' })).not.toBeInTheDocument();
  });

  it('Story 3 AC5: if checkout finds the event sold out, it offers the waitlist', async () => {
    startCheckout([{ ...event, remaining: 1 }]);
    const dialog = await openCheckout();
    await fillBuyer(dialog, '1');
    global.fetch = vi.fn().mockResolvedValue(response({
      error: 'This event just sold out.',
      offerWaitlist: true,
    }, 409));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hold seats' }));
    expect(await screen.findByRole('button', { name: 'Join waitlist' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/sold out/i);
    expect(screen.queryByRole('button', { name: 'Complete simulated payment' })).not.toBeInTheDocument();
  });
});
