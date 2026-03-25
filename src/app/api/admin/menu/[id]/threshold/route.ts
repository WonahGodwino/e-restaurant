import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent, getActorFromKey } from '@/lib/audit';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === process.env.ADMIN_DASHBOARD_KEY;
}

const updateThresholdSchema = z.object({
  lowStockThreshold: z.number().int().min(1).max(100000),
});

// PATCH /api/admin/menu/[id]/threshold - Update low stock threshold
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
    const { lowStockThreshold } = updateThresholdSchema.parse(body);

    const item = await db.foodItem.update({
      where: { id },
      data: { lowStockThreshold },
    });

    const actor = getActorFromKey(request.headers.get('x-admin-key'));
    void logAuditEvent(actor, 'stock.threshold_update', `FoodItem:${id}`, {
      lowStockThreshold,
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Failed to update threshold:', error);
    return NextResponse.json(
      { error: 'Failed to update threshold' },
      { status: 500 }
    );
  }
}
