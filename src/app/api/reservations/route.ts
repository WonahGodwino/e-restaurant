import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createReservationSchema } from "@/lib/validators";
import {
  sendEmail,
  generateReservationEmailTemplate,
  generateCustomerReservationConfirmationEmailTemplate,
} from "@/lib/email";
import { notifyAllAdminsAndCooks } from "@/lib/notifications";

function getAdminRecipient() {
  return (
    process.env.CONTACT_FORM_TO_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    "hello@e-restaurant.com"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const dateObj = new Date(data.date + "T00:00:00.000Z");

    const reservation = await db.reservation.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        partySize: data.partySize,
        date: dateObj,
        time: data.time,
        specialRequests: data.specialRequests || null,
      },
    });

    // Send email alert to admin
    const adminRecipient = getAdminRecipient();
    void sendEmail({
      to: adminRecipient,
      subject: `New reservation request from ${data.customerName}`,
      html: generateReservationEmailTemplate({
        ...data,
        customerPhone: data.customerPhone || null,
        specialRequests: data.specialRequests || null,
      }),
    });

    // Send confirmation email to customer
    void sendEmail({
      to: data.customerEmail,
      subject: "Reservation request received",
      html: generateCustomerReservationConfirmationEmailTemplate({
        customerName: data.customerName,
        partySize: data.partySize,
        date: data.date,
        time: data.time,
      }),
    });

    // Notify all admin/staff via notification system
    void notifyAllAdminsAndCooks(
      "NEW_RESERVATION",
      "New reservation request",
      `${data.customerName} requested a table for ${data.partySize} on ${data.date} at ${data.time}.`,
    );

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        message:
          "Your reservation request has been received. We will confirm your booking shortly.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return NextResponse.json(
      { error: "Failed to submit reservation request." },
      { status: 500 },
    );
  }
}
