import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent, getActorFromKey } from '@/lib/audit';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return Boolean(process.env.ADMIN_DASHBOARD_KEY) && key === process.env.ADMIN_DASHBOARD_KEY;
}

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED']),
});

// PATCH /api/admin/orders/[id]/status - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = updateOrderStatusSchema.parse(body);

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    });

    const actor = getActorFromKey(request.headers.get(adminKeyHeader));
    void logAuditEvent(actor, 'order.status_change', `Order:${id}`, {
      previousStatus: existing.status,
      newStatus: status,
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
