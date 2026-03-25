import ReservationFormClient from "@/components/ReservationFormClient";

export default function ReservationsPage() {
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || "+44 20 0000 0000";
  const supportHours = process.env.SUPPORT_HOURS?.trim() || "Monday to Sunday, 11:00 to 22:30";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Table booking</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">Reservations</h1>
        <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
          Reserve a table for your group. We&apos;ll confirm your booking as soon as possible.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-panel rounded-[1.8rem] p-6">
          <h2 className="text-2xl font-semibold text-white">Request a table</h2>
          <ReservationFormClient />
        </section>

        <aside className="space-y-4">
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Booking information</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Reservations are subject to availability. We will contact you to confirm your booking.
              For large groups of 10 or more, please contact us directly.
            </p>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Opening hours</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">{supportHours}</p>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Contact us</h2>
            <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="mt-3 block text-sm leading-7 text-white/66 transition hover:text-white">{supportPhone}</a>
            <p className="mt-2 text-sm leading-7 text-white/66">
              For same-day or urgent reservations, please call us directly.
            </p>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Planning a big event?</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              For catering, private dining, and large events, use our dedicated catering enquiry form.
            </p>
            <a
              href="/catering"
              className="mt-4 inline-flex rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Catering enquiries
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
