import Link from "next/link";

type PolicySection = {
  heading: string;
  paragraphs: string[];
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: PolicySection[];
};

export default function PolicyPage({ eyebrow, title, summary, sections }: PolicyPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="surface-panel rounded-[2rem] p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">{eyebrow}</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-8 text-white/66 sm:text-base">{summary}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6">
              <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-8 text-white/68 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-white/70">
          <Link href="/contact" className="rounded-full border border-white/10 bg-white/6 px-4 py-2 transition hover:bg-white/10 hover:text-white">
            Contact support
          </Link>
          <Link href="/menu" className="rounded-full border border-white/10 bg-white/6 px-4 py-2 transition hover:bg-white/10 hover:text-white">
            Return to menu
          </Link>
        </div>
      </section>
    </main>
  );
}