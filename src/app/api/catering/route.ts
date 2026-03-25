import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCateringRequestSchema } from "@/lib/validators";
import {
  sendEmail,
  generateCateringRequestEmailTemplate,
  generateCustomerCateringConfirmationEmailTemplate,
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
    const parsed = createCateringRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const eventDateObj = new Date(data.eventDate + "T00:00:00.000Z");

    const cateringRequest = await db.cateringRequest.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        eventType: data.eventType,
        eventDate: eventDateObj,
        guestCount: data.guestCount,
        budget: data.budget || null,
        notes: data.notes || null,
      },
    });

    // Send email alert to admin
    const adminRecipient = getAdminRecipient();
    void sendEmail({
      to: adminRecipient,
      subject: `New catering request from ${data.customerName}`,
      html: generateCateringRequestEmailTemplate({
        ...data,
        customerPhone: data.customerPhone || null,
        budget: data.budget || null,
        notes: data.notes || null,
      }),
    });

    // Send confirmation email to customer
    void sendEmail({
      to: data.customerEmail,
      subject: "Catering enquiry received",
      html: generateCustomerCateringConfirmationEmailTemplate({
        customerName: data.customerName,
        eventType: data.eventType,
        eventDate: data.eventDate,
        guestCount: data.guestCount,
      }),
    });

    // Notify all admin/staff via notification system
    void notifyAllAdminsAndCooks(
      "NEW_CATERING_REQUEST",
      "New catering request",
      `${data.customerName} submitted a catering enquiry for ${data.eventType} on ${data.eventDate} (${data.guestCount} guests).`,
    );

    return NextResponse.json(
      {
        success: true,
        requestId: cateringRequest.id,
        message:
          "Your catering enquiry has been received. Our team will contact you shortly to discuss your requirements.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create catering request:", error);
    return NextResponse.json(
      { error: "Failed to submit catering request." },
      { status: 500 },
    );
  }
}
