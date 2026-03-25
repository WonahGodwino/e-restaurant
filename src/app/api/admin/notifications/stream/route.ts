import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === process.env.ADMIN_DASHBOARD_KEY;
}

// GET /api/admin/notifications/stream - Server-Sent Events stream for real-time notifications
// Requires ?userId query param
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter required' },
      { status: 400 }
    );
  }

  // Create a custom response with streaming headers
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      // Send initial SSE comment
      controller.enqueue(encoder.encode(': SSE stream initialized\n\n'));

      // Keep track of last notification ID to avoid re-sending
      let lastNotificationId = '';
      let isConnected = true;

      // Send heartbeat and check for new notifications every 2 seconds
      const interval = setInterval(async () => {
        if (!isConnected) {
          clearInterval(interval);
          return;
        }

        try {
          // Get latest unread notification
          const latestNotification = await db.notification.findFirst({
            where: {
              userId,
              isRead: false,
              id: { not: lastNotificationId },
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          if (latestNotification) {
            lastNotificationId = latestNotification.id;
            const data = {
              id: latestNotification.id,
              type: latestNotification.type,
              title: latestNotification.title,
              message: latestNotification.message,
              createdAt: latestNotification.createdAt.toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          }
        } catch (error) {
          console.error('SSE stream error:', error);
        }
      }, 2000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isConnected = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(customReadable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
