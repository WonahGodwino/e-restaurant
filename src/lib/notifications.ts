import { db } from './db';
import { sendEmail } from './email';
import { NotificationType } from '@prisma/client';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  foodItemId?: string;
  orderId?: string;
  send: {
    email: boolean;
    dashboard: boolean;
  };
}

export async function createNotification(payload: NotificationPayload) {
  try {
    // Create notification record in database
    const notification = await db.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        foodItemId: payload.foodItemId,
        orderId: payload.orderId,
        emailSent: false,
      },
      include: {
        user: true,
      },
    });

    // Check user notification preferences
    const prefs = await db.notificationPreference.findUnique({
      where: {
        userId_notificationType: {
          userId: payload.userId,
          notificationType: payload.type,
        },
      },
    });

    // Send email if enabled in preferences and payload requests it
    if (payload.send.email && prefs?.emailEnabled && notification.user.email) {
      // Email sending happens in background (don't await)
      sendEmailNotification(notification.user.email, payload)
        .then(() => {
          db.notification.update({
            where: { id: notification.id },
            data: { emailSent: true, emailSentAt: new Date() },
          }).catch(() => {});
        })
        .catch((err) => console.error('Failed to send notification email:', err));
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

async function sendEmailNotification(
  recipientEmail: string,
  payload: NotificationPayload
) {
  let html = '';

  switch (payload.type) {
    case 'LOW_STOCK':
      // This will be enhanced when called from stock service
      html = payload.message;
      break;
    case 'NEW_ORDER':
      // This will be enhanced when called from order service
      html = payload.message;
      break;
    case 'ORDER_STATUS_CHANGE':
      html = payload.message;
      break;
  }

  return sendEmail({
    to: recipientEmail,
    subject: payload.title,
    html,
  });
}

export async function notifyAllAdminsAndCooks(
  type: NotificationType,
  title: string,
  message: string,
  foodItemId?: string,
  orderId?: string
) {
  // Get all admins and cooks
  const users = await db.user.findMany({
    where: {
      role: { in: ['ADMIN', 'COOK', 'MANAGER'] },
      isActive: true,
    },
  });

  const promises = users.map((user) =>
    createNotification({
      userId: user.id,
      type,
      title,
      message,
      foodItemId,
      orderId,
      send: { email: true, dashboard: true },
    }).catch((err) => console.error(`Failed to notify ${user.id}:`, err))
  );

  await Promise.allSettled(promises);
}

export async function getUnreadNotifications(userId: string) {
  return db.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

export async function markAsRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function getNotificationHistory(userId: string, limit = 100) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
