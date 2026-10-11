import type { Metadata } from "next";
import { Brand } from "@/components/ui/Brand";
import { NotebookList } from "@/components/notebook/NotebookList";
import Link from "next/link";

export const metadata: Metadata = { title: "Lab notebook · Will it Material?" };

export default function NotebookPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <Brand />
        <Link href="/explore" className="btn bg-iris px-4 py-1 text-base text-paper-raised">
          Test something
        </Link>
      </header>
      <h1 className="ink-texture mb-2 font-display text-4xl sm:text-5xl">Your lab notebook</h1>
      <p className="mb-6 text-lg text-soft">Everything you&apos;ve tested so far. Open one to see the full results again.</p>
      <NotebookList />
    </main>
  );
}
