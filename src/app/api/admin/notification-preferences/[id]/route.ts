import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === (process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY);
}

const updatePreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  dashboardEnabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

// PATCH /api/admin/notification-preferences/[id] - Update preference
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
    const data = updatePreferenceSchema.parse(body);

    const preference = await db.notificationPreference.update({
      where: { id },
      data,
    });

    return NextResponse.json(preference);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Failed to update preference:', error);
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    );
  }
}
