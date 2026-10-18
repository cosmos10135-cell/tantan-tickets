// Demo dates are anchored at server startup so examples stay upcoming.
const startup = Date.now();
const daysFromStartup = (days) => new Date(startup + days * 86400000).toISOString();
const events = [
  { id: 'concert', title: 'An evening of live music', club: 'CMU Music Club · Sample event', startsAt: daysFromStartup(3), location: 'Cohon University Center', priceCents: 1200, capacity: 100, sold: 75, status: 'published', category: 'Music' },
  { id: 'film', title: 'Movie night on campus', club: 'CMU Film Club · Sample event', startsAt: daysFromStartup(5), location: 'McConomy Auditorium', priceCents: 500, capacity: 80, sold: 80, status: 'published', category: 'Film' },
  { id: 'games', title: 'Board games & new friends', club: 'CMU Games Club · Sample event', startsAt: daysFromStartup(7), location: 'Gates Center Commons', priceCents: 0, capacity: 40, sold: 12, status: 'published', category: 'Community' },
];

export function listUpcomingEvents(now = new Date(), source = events) {
  return source
    .filter((event) => event.status === 'published' && new Date(event.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .map(({ sold, capacity, status, ...event }) => ({ ...event, remaining: Math.max(0, capacity - sold) }));
}
