import { getUpcomingEvents } from '../../../lib/orders';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(getUpcomingEvents(), { headers: { 'Cache-Control': 'no-store' } });
}
