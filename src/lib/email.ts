import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      console.log('Email would have been sent to:', options.to);
      console.log('Subject:', options.subject);
      return { success: false, error: 'SendGrid not configured' };
    }

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@e-restaurant.com',
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

export function generateLowStockEmailTemplate(
  itemName: string,
  currentStock: number,
  threshold: number
): string {
  return `
    <h2>⚠️ Low Stock Alert</h2>
    <p>The food item <strong>${itemName}</strong> is running low on stock.</p>
    <ul>
      <li><strong>Current Stock:</strong> ${currentStock}</li>
      <li><strong>Low Stock Threshold:</strong> ${threshold}</li>
    </ul>
    <p>Please prepare more stock to avoid stockouts.</p>
  `;
}

export function generateNewOrderEmailTemplate(
  orderId: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: string }>,
  total: string,
  deliveryAddress: string
): string {
  const itemsList = items
    .map((item) => `<li>${item.name} x ${item.quantity} - ${item.price}</li>`)
    .join('');

  return `
    <h2>📦 New Order Received!</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Customer:</strong> ${customerName}</p>
    <h3>Items:</h3>
    <ul>${itemsList}</ul>
    <p><strong>Total:</strong> ${total}</p>
    <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
    <p>Please start preparing this order!</p>
  `;
}
