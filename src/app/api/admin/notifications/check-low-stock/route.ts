import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { generateLowStockEmailTemplate, sendEmail } from '@/lib/email';

const adminKeyHeader = 'x-admin-key';

function isAdmin(request: NextRequest): boolean {
  const key = request.headers.get(adminKeyHeader);
  return key === (process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY);
}

// GET /api/admin/notifications/check-low-stock - Check and notify low stock items
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all items below their threshold
    const lowStockItems = await db.foodItem.findMany({
      where: {
        stockQuantity: {
          gt: 0, // Only items with some stock (not completely out)
        },
        isAvailable: true,
      },
    });

    const itemsToNotify = lowStockItems.filter(
      (item) => item.stockQuantity <= item.lowStockThreshold
    );

    const notified = [];

    for (const item of itemsToNotify) {
      // Get all active admins, managers, and cooks
      const recipients = await db.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MANAGER', 'COOK'] },
          isActive: true,
        },
      });

      // Create notifications for each recipient
      for (const user of recipients) {
        const notification = await createNotification({
          userId: user.id,
          type: 'LOW_STOCK',
          title: `Low Stock Alert: ${item.name}`,
          message: `${item.name} is running low on stock. Current: ${item.stockQuantity}, Threshold: ${item.lowStockThreshold}`,
          foodItemId: item.id,
          send: { email: true, dashboard: true },
        });

        // Send email with formatted template
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: `🚨 Low Stock Alert: ${item.name}`,
            html: generateLowStockEmailTemplate(
              item.name,
              item.stockQuantity,
              item.lowStockThreshold
            ),
          }).catch((err) => console.error('Email send failed:', err));
        }

        notified.push({
          itemId: item.id,
          itemName: item.name,
          userId: user.id,
          notificationId: notification.id,
        });
      }
    }

    return NextResponse.json({
      lowStockCount: itemsToNotify.length,
      notificationsCreated: notified.length,
      items: itemsToNotify.map((item) => ({
        id: item.id,
        name: item.name,
        currentStock: item.stockQuantity,
        threshold: item.lowStockThreshold,
      })),
    });
  } catch (error) {
    console.error('Failed to check low stock:', error);
    return NextResponse.json(
      { error: 'Failed to check low stock' },
      { status: 500 }
    );
  }
}
