import Link from "next/link";
import { SpecimenShelf } from "@/components/landing/SpecimenShelf";
import { NumberSticker } from "@/components/form/TestForm";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { NotebookLink } from "@/components/notebook/NotebookLink";

const STEPS = [
  { title: "Pick a thing", text: "Sneakers, acrylic nails, a Mars rover. Literally anything." },
  { title: "Make its life hard", text: "Slide the temperature, add some force, flip on water, sun or space." },
  { title: "Watch it get tested", text: "It rides through a cartoon test chamber. Some survive." },
  { title: "Find a better one", text: "See what went wrong and try a material that does better." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav className="flex items-center justify-end gap-4 py-6">
        <Disclaimer compact />
        <NotebookLink />
      </nav>

      <section className="flex flex-col items-center pb-16 pt-6 text-center sm:pt-12">
        <h1 className="font-display leading-[0.9]">
          <span className="ink-texture block text-[clamp(2rem,6vw,3.75rem)] italic">Will it</span>
          <span className="ink-texture block text-[clamp(3.6rem,15vw,10.5rem)] tracking-[-0.015em]">Material?</span>
        </h1>

        <div className="mt-10 w-full max-w-3xl">
          <SpecimenShelf />
        </div>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-soft">
          Pick anything, choose what it&apos;s made of, and see if it survives heat, cold, water and a lot of squishing. Then find
          something that works better.
        </p>

        <Link href="/explore" className="btn mt-8 bg-iris px-8 py-3.5 text-xl text-paper-raised">
          Let&apos;s test something
        </Link>
      </section>

      <ol className="grid gap-px overflow-hidden rounded-2xl border-2 border-sand bg-sand sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-paper p-5 sm:p-6">
            <NumberSticker n={i + 1} />
            <h2 className="mt-3 font-display text-xl text-ink">{s.title}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
