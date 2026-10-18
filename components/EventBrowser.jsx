'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

async function fetchEvents() {
  const response = await fetch('/api/events', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load events');
  return response.json();
}

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
const moneyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function EventBrowser({ loadEvents = fetchEvents }) {
  const [events, setEvents] = useState([]);
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [offerWaitlist, setOfferWaitlist] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setState('loading');
    Promise.resolve().then(loadEvents).then((data) => {
      if (active) { setEvents(data); setState('success'); }
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [loadEvents, attempt]);

  async function beginCheckout(formEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setCheckoutError('');
    const form = new FormData(formEvent.currentTarget);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          seats: Number(form.get('seats')),
          name: form.get('name'),
          email: form.get('email'),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setCheckoutError(result.error || 'Could not start checkout.');
        setOfferWaitlist(result.offerWaitlist === true);
        if (response.status === 409) setAttempt((value) => value + 1);
        return;
      }
      setCheckout(result.order);
      setAttempt((value) => value + 1);
    } catch {
      setCheckoutError('Could not start checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function completeCheckout() {
    if (!checkout || submitting) return;
    setSubmitting(true);
    setCheckoutError('');
    try {
      const response = await fetch(`/api/orders/${checkout.id}/complete`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        setCheckoutError(result.error || 'Could not complete the simulated payment.');
        if (response.status === 409 || response.status === 410) {
          setCheckout(null);
          setOfferWaitlist(true);
        }
        setAttempt((value) => value + 1);
        return;
      }
      setReceipt(result.receipt);
      setCheckout(null);
      setSelectedEvent(null);
      setAttempt((value) => value + 1);
    } catch {
      setCheckoutError('Could not complete the simulated payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'loading') return <div className="state-panel" role="status">Loading events…</div>;
  if (state === 'error') return <div className="state-panel"><p role="alert">Could not load events. Please try again.</p><button onClick={() => setAttempt(attempt + 1)}>Try again</button></div>;
  if (!events.length) return <div className="state-panel"><p>No upcoming events yet.</p><p>Check back soon for something to look forward to.</p></div>;

  return <>
    <div className="list-heading"><h2>Upcoming events</h2><span>{events.length} events · Pittsburgh time</span></div>
    <div className="event-grid">
      {events.map((event, index) => {
        const soldOut = event.remaining === 0;
        const date = new Date(event.startsAt);
        return <article key={event.id} aria-labelledby={`title-${event.id}`} className="event-card">
          <div className={`card-art art-${index % 3}`} aria-hidden="true"><span>{event.category || 'Campus'}</span><div className="art-symbol">{['♫', '▶', '✦'][index % 3]}</div></div>
          <div className="card-content">
            <p className="club">{event.club}</p>
            <h3 id={`title-${event.id}`}>{event.title}</h3>
            <dl><div><dt>Date</dt><dd><time dateTime={event.startsAt}>{dateFormat.format(date)} · {timeFormat.format(date)}</time></dd></div><div><dt>Location</dt><dd>{event.location}</dd></div></dl>
            <p className={`availability ${soldOut ? 'sold-out' : ''}`}>{soldOut ? 'Sold out' : `${event.remaining} ${event.remaining === 1 ? 'seat' : 'seats'} remaining`}</p>
            <div className="card-bottom"><strong>{event.priceCents === 0 ? 'Free' : moneyFormat.format(event.priceCents / 100)}</strong><button className={soldOut ? 'secondary' : ''} onClick={() => soldOut ? setMessage(`${event.title}: Waitlist registration is coming later.`) : (setSelectedEvent(event), setCheckout(null), setCheckoutError(''), setOfferWaitlist(false), setReceipt(null))}>{soldOut ? 'Join waitlist' : 'Buy'}</button></div>
          </div>
        </article>;
      })}
    </div>
    <p role="status" className={message ? 'notice' : 'live-message'}>{message}</p>
    {selectedEvent && <section className="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="checkout-card">
        <button className="close-button secondary" type="button" aria-label="Close checkout" onClick={() => { setSelectedEvent(null); setCheckout(null); setCheckoutError(''); }}>×</button>
        <h2 id="checkout-title">Checkout: {selectedEvent.title}</h2>
        {!checkout ? <form onSubmit={beginCheckout}>
          <label>Number of tickets<input name="seats" type="number" min="1" max="4" defaultValue="1" required /></label>
          <label>Full name<input name="name" type="text" autoComplete="name" required /></label>
          <label>CMU email<input name="email" type="email" autoComplete="email" required /></label>
          <p>Payment is simulated for this demo. No card details are collected.</p>
          {checkoutError && <p role="alert">{checkoutError}</p>}
          {offerWaitlist && <button type="button" className="secondary" onClick={() => { setSelectedEvent(null); setMessage('Waitlist registration is coming later.'); }}>Join waitlist</button>}
          <button type="submit" disabled={submitting}>{submitting ? 'Starting checkout…' : 'Hold seats'}</button>
        </form> : <div>
          <p role="status">{checkout.seats} {checkout.seats === 1 ? 'seat is' : 'seats are'} held for 10 minutes. Total: {checkout.totalCents === 0 ? 'Free' : moneyFormat.format(checkout.totalCents / 100)}.</p>
          <button type="button" onClick={completeCheckout} disabled={submitting}>{submitting ? 'Completing…' : 'Complete simulated payment'}</button>
          {checkoutError && <p role="alert">{checkoutError}</p>}
        </div>}
      </div>
    </section>}
    {receipt && <section className="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div className="checkout-card receipt-card">
        <button className="close-button secondary" type="button" aria-label="Close receipt" onClick={() => setReceipt(null)}>×</button>
        <h2 id="receipt-title">Purchase complete</h2>
        <p role="status">Simulated receipt for {receipt.eventTitle}, {receipt.seats} {receipt.seats === 1 ? 'ticket' : 'tickets'} · {receipt.totalCents === 0 ? 'Free' : moneyFormat.format(receipt.totalCents / 100)}.</p>
        {receipt.tickets.map((ticket, index) => <div className="ticket-qr" key={ticket.id}>
          <strong>Ticket {index + 1}</strong>
          <QRCodeSVG value={ticket.qrToken} size={168} role="img" aria-label="Ticket QR code" />
        </div>)}
        <p>Save this demo receipt. Real payments and email delivery are not enabled.</p>
      </div>
    </section>}
  </>;
}
