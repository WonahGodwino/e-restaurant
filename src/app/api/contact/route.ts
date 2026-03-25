import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateContactEmailTemplate } from "@/lib/email";
import { contactFormSchema } from "@/lib/validators";

function getContactRecipient() {
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
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const recipient = getContactRecipient();
    const emailResult = await sendEmail({
      to: recipient,
      subject: `New contact enquiry: ${data.subject}`,
      html: generateContactEmailTemplate(data),
      text: [
        `Subject: ${data.subject}`,
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || "Not provided"}`,
        "",
        data.message,
      ].join("\n"),
    });

    if (!emailResult.success) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          success: true,
          preview: true,
          message: "Message received in preview mode. Configure SendGrid to send emails.",
        });
      }

      return NextResponse.json(
        { error: "Contact service is not available right now. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your enquiry has been sent. We will get back to you shortly.",
    });
  } catch (error) {
    console.error("Failed to process contact form:", error);
    return NextResponse.json(
      { error: "Failed to process contact form." },
      { status: 500 },
    );
  }
}