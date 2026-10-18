'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    let active = true;
    setState('loading');
    Promise.resolve().then(loadEvents).then((data) => {
      if (active) { setEvents(data); setState('success'); }
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [loadEvents, attempt]);

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
            <div className="card-bottom"><strong>{event.priceCents === 0 ? 'Free' : moneyFormat.format(event.priceCents / 100)}</strong><button className={soldOut ? 'secondary' : ''} onClick={() => setMessage(`${event.title}: ${soldOut ? 'Waitlist registration' : 'Purchasing'} is coming later. This demo does not reserve seats or take payments.`)}>{soldOut ? 'Join waitlist' : 'Buy'}</button></div>
          </div>
        </article>;
      })}
    </div>
    <p role="status" className={message ? 'notice' : 'live-message'}>{message}</p>
  </>;
}
