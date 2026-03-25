import Link from "next/link";
import ContactFormClient from "@/components/ContactFormClient";

export default function ContactPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "hello@e-restaurant.com";
  const supportPhone = process.env.SUPPORT_PHONE?.trim() || "+44 20 0000 0000";
  const supportHours = process.env.SUPPORT_HOURS?.trim() || "Monday to Sunday, 11:00 to 22:30";
  const serviceArea = process.env.SERVICE_AREA?.trim() || "London service area with online ordering and admin-side operations controls.";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Get in touch</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">Contact</h1>
        <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
          Use this page as the public contact surface for catering, delivery questions, partnerships, or menu support.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-panel rounded-[1.8rem] p-6">
          <h2 className="text-2xl font-semibold text-white">Send a message</h2>
          <ContactFormClient />
        </section>

        <aside className="space-y-4">
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Restaurant</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">{serviceArea}</p>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Support</h2>
            <a href={`mailto:${supportEmail}`} className="mt-3 block text-sm leading-7 text-white/66 transition hover:text-white">{supportEmail}</a>
            <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="block text-sm leading-7 text-white/66 transition hover:text-white">{supportPhone}</a>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Hours</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">{supportHours}</p>
          </div>
          <div className="surface-panel rounded-[1.8rem] p-6">
            <h2 className="text-xl font-semibold text-white">Policies</h2>
            <div className="mt-3 space-y-2 text-sm leading-7 text-white/66">
              <Link href="/allergy-disclaimer" className="block transition hover:text-white">Allergy disclaimer</Link>
              <Link href="/delivery-policy" className="block transition hover:text-white">Delivery policy</Link>
              <Link href="/refund-policy" className="block transition hover:text-white">Refund policy</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}