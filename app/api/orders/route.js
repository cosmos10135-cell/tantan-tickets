import { startCheckout, TicketingError } from '../../../lib/orders';

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Send a valid JSON checkout request.' }, { status: 400 });
  }

  try {
    const order = startCheckout(input);
    return Response.json({ order }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (!(error instanceof TicketingError)) throw error;
    return Response.json(
      { error: error.message, offerWaitlist: error.offerWaitlist },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
