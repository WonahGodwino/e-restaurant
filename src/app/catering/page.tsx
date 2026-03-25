import CateringFormClient from "@/components/CateringFormClient";

export default function CateringPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "hello@e-restaurant.com";
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || "+44 20 0000 0000";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Large orders &amp; events</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">Catering Enquiries</h1>
        <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
          Planning a corporate event, wedding, private dining, or large gathering? Tell us about your
          event and our team will be in touch with a tailored quote.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-panel rounded-[1.8rem] p-6">
          <h2 className="text-2xl font-semibold text-white">Submit a catering enquiry</h2>
          <CateringFormClient />
        </section>

        <aside className="space-y-4">
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">What we cater</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-white/66">
              {[
                "Corporate events & office lunches",
                "Weddings & private dining",
                "Birthday celebrations",
                "Community & cultural events",
                "Large group orders",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[var(--accent)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Get in touch</h2>
            <a href={`mailto:${supportEmail}`} className="mt-3 block text-sm leading-7 text-white/66 transition hover:text-white">{supportEmail}</a>
            <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="block text-sm leading-7 text-white/66 transition hover:text-white">{supportPhone}</a>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Just want a table?</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              For standard restaurant reservations, use our table booking form.
            </p>
            <a
              href="/reservations"
              className="mt-4 inline-flex rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Reserve a table
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
