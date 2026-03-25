import { NextRequest, NextResponse } from 'next/server';
import { getUnreadNotifications, markAsRead, getNotificationHistory } from '@/lib/notifications';
import { z } from 'zod';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === process.env.ADMIN_DASHBOARD_KEY;
}

// GET /api/admin/notifications - Get unread notifications for user
// Requires ?userId query param
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const action = request.nextUrl.searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter required' },
        { status: 400 }
      );
    }

    if (action === 'history') {
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
      const notifications = await getNotificationHistory(userId, limit);
      return NextResponse.json({ notifications });
    }

    // Default: get unread notifications
    const notifications = await getUnreadNotifications(userId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications - Mark notification as read
const markReadSchema = z.object({
  notificationId: z.string(),
});

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationId } = markReadSchema.parse(body);

    const notification = await markAsRead(notificationId);
    return NextResponse.json(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
