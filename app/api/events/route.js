import { listUpcomingEvents } from '../../../lib/events';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(listUpcomingEvents(), { headers: { 'Cache-Control': 'no-store' } });
}
