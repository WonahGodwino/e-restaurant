import sgMail from '@sendgrid/mail';

import type { ContactFormInput } from '@/lib/validators';

const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
const hasConfiguredSendGrid = Boolean(sendGridApiKey && sendGridApiKey.startsWith('SG.'));

if (hasConfiguredSendGrid) {
  sgMail.setApiKey(sendGridApiKey!);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!hasConfiguredSendGrid) {
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

export function generateContactEmailTemplate(input: ContactFormInput): string {
  return `
    <h2>New Contact Enquiry</h2>
    <p><strong>Subject:</strong> ${input.subject}</p>
    <p><strong>Name:</strong> ${input.name}</p>
    <p><strong>Email:</strong> ${input.email}</p>
    <p><strong>Phone:</strong> ${input.phone || 'Not provided'}</p>
    <h3>Message</h3>
    <p>${input.message.replace(/\n/g, '<br />')}</p>
  `;
}

export function generateCustomerOrderConfirmationEmailTemplate(
  orderId: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: string }>,
  total: string,
  confirmationUrl: string,
  statusUrl: string,
  deliveryAddress?: string,
): string {
  const itemLines = items
    .map((item) => `<li>${item.name} x ${item.quantity} - ${item.price}</li>`)
    .join("");

  const deliverySection = deliveryAddress
    ? `<p><strong>Delivery address:</strong> ${deliveryAddress}</p>`
    : "";

  return `
    <h2>Thanks for your order, ${customerName}!</h2>
    <p>Your order has been received.</p>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <h3>Order summary</h3>
    <ul>${itemLines}</ul>
    <p><strong>Total:</strong> ${total}</p>
    ${deliverySection}
    <p>
      <a href="${confirmationUrl}">View order confirmation</a>
    </p>
    <p>
      <a href="${statusUrl}">Track your order status</a>
    </p>
  `;
}

export function generateReservationEmailTemplate(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  partySize: number;
  date: string;
  time: string;
  specialRequests?: string | null;
}): string {
  return `
    <h2>🍽️ New Reservation Request</h2>
    <p><strong>Name:</strong> ${data.customerName}</p>
    <p><strong>Email:</strong> ${data.customerEmail}</p>
    <p><strong>Phone:</strong> ${data.customerPhone || 'Not provided'}</p>
    <p><strong>Party size:</strong> ${data.partySize}</p>
    <p><strong>Date:</strong> ${data.date}</p>
    <p><strong>Time:</strong> ${data.time}</p>
    <p><strong>Special requests:</strong> ${data.specialRequests || 'None'}</p>
    <p>Please confirm or contact the customer to discuss the booking.</p>
  `;
}

export function generateCustomerReservationConfirmationEmailTemplate(data: {
  customerName: string;
  partySize: number;
  date: string;
  time: string;
}): string {
  return `
    <h2>Thanks for your reservation request, ${data.customerName}!</h2>
    <p>We have received your request and will be in touch shortly to confirm your booking.</p>
    <h3>Reservation details</h3>
    <ul>
      <li><strong>Party size:</strong> ${data.partySize}</li>
      <li><strong>Date:</strong> ${data.date}</li>
      <li><strong>Time:</strong> ${data.time}</li>
    </ul>
    <p>If you need to make changes, please contact us directly.</p>
  `;
}

export function generateReservationDecisionEmailTemplate(data: {
  customerName: string;
  partySize: number;
  date: string;
  time: string;
  status: "CONFIRMED" | "CANCELLED";
  reason?: string | null;
}): string {
  const isConfirmed = data.status === "CONFIRMED";
  const statusLabel = isConfirmed ? "Confirmed" : "Rejected";
  const heading = isConfirmed
    ? `Your reservation is confirmed, ${data.customerName}!`
    : `Your reservation request was not approved, ${data.customerName}`;
  const summary = isConfirmed
    ? "Great news. Your table is now reserved."
    : "We are sorry, your reservation request has been rejected.";
  const reasonSection = !isConfirmed && data.reason
    ? `<p><strong>Reason:</strong> ${data.reason}</p>`
    : "";

  return `
    <h2>${heading}</h2>
    <p>${summary}</p>
    <h3>Reservation details</h3>
    <ul>
      <li><strong>Party size:</strong> ${data.partySize}</li>
      <li><strong>Date:</strong> ${data.date}</li>
      <li><strong>Time:</strong> ${data.time}</li>
      <li><strong>Status:</strong> ${statusLabel}</li>
    </ul>
    ${reasonSection}
    <p>If you need any assistance, please contact us and we will be glad to help.</p>
  `;
}

export function generateCateringRequestEmailTemplate(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget?: string | null;
  notes?: string | null;
}): string {
  return `
    <h2>🎉 New Catering Request</h2>
    <p><strong>Name:</strong> ${data.customerName}</p>
    <p><strong>Email:</strong> ${data.customerEmail}</p>
    <p><strong>Phone:</strong> ${data.customerPhone || 'Not provided'}</p>
    <p><strong>Event type:</strong> ${data.eventType}</p>
    <p><strong>Event date:</strong> ${data.eventDate}</p>
    <p><strong>Guest count:</strong> ${data.guestCount}</p>
    <p><strong>Budget:</strong> ${data.budget || 'Not specified'}</p>
    <p><strong>Notes:</strong> ${data.notes || 'None'}</p>
    <p>Please follow up with the customer to discuss requirements and provide a quote.</p>
  `;
}

export function generateCustomerCateringConfirmationEmailTemplate(data: {
  customerName: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
}): string {
  return `
    <h2>Thanks for your catering enquiry, ${data.customerName}!</h2>
    <p>We have received your catering request and will be in touch shortly to discuss your requirements.</p>
    <h3>Enquiry details</h3>
    <ul>
      <li><strong>Event type:</strong> ${data.eventType}</li>
      <li><strong>Event date:</strong> ${data.eventDate}</li>
      <li><strong>Guest count:</strong> ${data.guestCount}</li>
    </ul>
    <p>Our team will review your request and contact you with a tailored quote.</p>
  `;
}
