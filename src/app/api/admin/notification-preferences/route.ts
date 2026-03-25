import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === (process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY);
}

// GET /api/admin/notification-preferences - Get preferences for user
// Requires ?userId query param
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter required' },
        { status: 400 }
      );
    }

    const preferences = await db.notificationPreference.findMany({
      where: { userId },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
