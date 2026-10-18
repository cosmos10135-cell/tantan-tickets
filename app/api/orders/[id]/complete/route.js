import { settlePayment, TicketingError } from '../../../../../lib/orders';

export async function POST(_request, context) {
  const { id } = await context.params;
  try {
    const result = settlePayment(id, 'succeeded');
    return Response.json({ receipt: result.receipt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (!(error instanceof TicketingError)) throw error;
    return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  }
}
