import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import EventBrowser from '../components/EventBrowser';
import { listUpcomingEvents } from '../lib/events';

const now = new Date('2026-10-01T16:00:00Z');
const available = { id: 'music', title: 'Campus Concert', club: 'Music Club', startsAt: '2026-10-03T23:00:00Z', location: 'Cohon Center', priceCents: 1200, capacity: 100, sold: 75, status: 'published' };
const soldOut = { ...available, id: 'film', title: 'Film Night', startsAt: '2026-10-02T23:00:00Z', sold: 100 };
const load = (events) => vi.fn().mockResolvedValue(events);

describe('Story 1: Browse events', () => {
  it('Story 1 AC1: lists date, location, price and seats remaining', async () => {
    render(<EventBrowser loadEvents={load([{ ...available, remaining: 25 }])} />);
    const card = await screen.findByRole('article', { name: 'Campus Concert' });
    expect(within(card).getByText(/Oct 3, 2026/)).toBeInTheDocument();
    expect(within(card).getByText(/7:00 PM/)).toBeInTheDocument();
    expect(within(card).getByText('Cohon Center')).toBeInTheDocument();
    expect(within(card).getByText('$12.00')).toBeInTheDocument();
    expect(within(card).getByText('25 seats remaining')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Buy' })).toBeEnabled();
  });
  it('Story 1 AC2: sold-out events offer Join waitlist instead of Buy', async () => {
    render(<EventBrowser loadEvents={load([{ ...soldOut, remaining: 0 }])} />);
    const card = await screen.findByRole('article', { name: 'Film Night' });
    expect(within(card).getByText('Sold out')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Join waitlist' })).toBeEnabled();
    expect(within(card).queryByRole('button', { name: 'Buy' })).not.toBeInTheDocument();
  });
  it('Story 1 AC1: server excludes past/cancelled/draft events, sorts by date, and calculates remaining seats', () => {
    const result = listUpcomingEvents(now, [available, soldOut,
      { ...available, id: 'past', startsAt: '2026-09-01T12:00:00Z' },
      { ...available, id: 'cancelled', status: 'cancelled' },
      { ...available, id: 'draft', status: 'draft' },
      { ...available, id: 'started', startsAt: now.toISOString() },
    ]);
    expect(result.map((event) => event.id)).toEqual(['film', 'music']);
    expect(result.map((event) => event.remaining)).toEqual([0, 25]);
  });
  it('Story 1: shows loading and empty states', async () => {
    render(<EventBrowser loadEvents={load([])} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading events');
    expect(await screen.findByText('No upcoming events yet.')).toBeInTheDocument();
  });
  it('Story 1: offers retry after a loading error', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    render(<EventBrowser loadEvents={loader} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load events');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No upcoming events yet.')).toBeInTheDocument();
  });
  it('Story 1: free events remain free, Buy starts checkout, and waitlist does not change inventory', async () => {
    render(<EventBrowser loadEvents={load([{ ...available, priceCents: 0, remaining: 25 }, { ...soldOut, remaining: 0 }])} />);
    expect(await screen.findByText('Free')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(screen.getByRole('dialog', { name: /checkout/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));
    expect(screen.getByRole('status')).toHaveTextContent('Waitlist registration is coming later');
    expect(screen.getByText('25 seats remaining')).toBeInTheDocument();
  });
  it('Story 1 SEC-20: event text is displayed without executing HTML', async () => {
    render(<EventBrowser loadEvents={load([{ ...available, title: '<script>alert(1)</script>', remaining: 25 }])} />);
    expect(await screen.findByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
