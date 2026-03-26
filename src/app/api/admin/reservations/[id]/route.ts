import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";
import { updateReservationStatusSchema } from "@/lib/validators";
import { notifyAllAdminsAndCooks } from "@/lib/notifications";
import { generateReservationDecisionEmailTemplate, sendEmail } from "@/lib/email";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateReservationStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existingReservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    const decisionReason = parsed.data.decisionReason?.trim() || null;
    const shouldRecordDecision = parsed.data.status === "CONFIRMED" || parsed.data.status === "CANCELLED";

    const reservation = await db.reservation.update({
      where: { id },
      data: {
        status: parsed.data.status,
        decisionReason: parsed.data.status === "CANCELLED" ? decisionReason : null,
        decidedAt: shouldRecordDecision ? new Date() : null,
      },
    });

    const statusChanged = existingReservation.status !== reservation.status;

    if (statusChanged && (reservation.status === "CONFIRMED" || reservation.status === "CANCELLED")) {
      const dateText = new Date(reservation.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      void sendEmail({
        to: reservation.customerEmail,
        subject:
          reservation.status === "CONFIRMED"
            ? "Your reservation is confirmed"
            : "Update on your reservation request",
        html: generateReservationDecisionEmailTemplate({
          customerName: reservation.customerName,
          partySize: reservation.partySize,
          date: dateText,
          time: reservation.time,
          status: reservation.status,
          reason: decisionReason,
        }),
      });
    }

    if (statusChanged) {
      const reasonSuffix = decisionReason ? ` Reason: ${decisionReason}` : "";
      void notifyAllAdminsAndCooks(
        "NEW_RESERVATION",
        `Reservation ${reservation.status.toLowerCase()}`,
        `${reservation.customerName}'s reservation for ${reservation.partySize} on ${new Date(reservation.date).toLocaleDateString("en-GB")} at ${reservation.time} is now ${reservation.status}.${reasonSuffix}`,
      );

      void db.auditLog.create({
        data: {
          actor: "admin",
          action: "RESERVATION_STATUS_UPDATED",
          target: reservation.id,
          details: `Status changed from ${existingReservation.status} to ${reservation.status}.${reasonSuffix}`,
        },
      });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Failed to update reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.reservation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation." },
      { status: 500 },
    );
  }
}
