/**
 * Notification channel abstraction.
 *
 * Each channel (email, SMS, WhatsApp, …) implements NotificationChannel.
 * New channels can be added to the `channels` registry below without
 * changing any call-sites.
 */

import {
  sendEmail,
  generateCustomerOrderConfirmationEmailTemplate,
} from './email';

// ---------------------------------------------------------------------------
// Shared payload types
// ---------------------------------------------------------------------------

export interface OrderConfirmationPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  deliveryAddress: string;
  confirmationUrl: string;
  statusUrl: string;
}

// ---------------------------------------------------------------------------
// Channel interface
// ---------------------------------------------------------------------------

export interface NotificationChannel {
  /** Human-readable channel name used in log messages. */
  readonly name: string;
  sendOrderConfirmation(
    payload: OrderConfirmationPayload,
  ): Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Email channel
// ---------------------------------------------------------------------------

const emailChannel: NotificationChannel = {
  name: 'email',

  async sendOrderConfirmation(payload) {
    const html = generateCustomerOrderConfirmationEmailTemplate(
      payload.orderId,
      payload.customerName,
      payload.items,
      payload.total,
      payload.confirmationUrl,
      payload.statusUrl,
      payload.deliveryAddress,
    );

    return sendEmail({
      to: payload.customerEmail,
      subject: `Your order #${payload.orderId} confirmation`,
      html,
      text: [
        `Thanks for your order, ${payload.customerName}.`,
        `Order ID: ${payload.orderId}`,
        `Total: ${payload.total}`,
        `Delivery to: ${payload.deliveryAddress}`,
        `Confirmation: ${payload.confirmationUrl}`,
        `Track status: ${payload.statusUrl}`,
      ].join('\n'),
    });
  },
};

// ---------------------------------------------------------------------------
// Channel registry
// Add SMS or WhatsApp channels here when they become available, e.g.:
//   import { smsChannel } from './sms-channel';
//   channels.push(smsChannel);
// ---------------------------------------------------------------------------

const channels: NotificationChannel[] = [emailChannel];

// ---------------------------------------------------------------------------
// Public dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends an order-confirmation notification to the customer via every
 * registered channel.  Failures are logged but do not throw so that a
 * single broken channel never blocks order creation.
 */
export async function sendOrderConfirmationToCustomer(
  payload: OrderConfirmationPayload,
): Promise<void> {
  const results = await Promise.allSettled(
    channels.map((ch) => ch.sendOrderConfirmation(payload)),
  );

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(
        `[notification-channels] ${channels[i].name} order confirmation failed:`,
        result.reason,
      );
    } else if (!result.value.success) {
      console.warn(
        `[notification-channels] ${channels[i].name} did not send order confirmation:`,
        result.value.error,
      );
    }
  });
}
