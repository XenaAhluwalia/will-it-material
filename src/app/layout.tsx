import type { Metadata } from "next";
import { Libre_Franklin, Old_Standard_TT } from "next/font/google";
import { Disclaimer } from "@/components/ui/Disclaimer";
import "./globals.css";

const oldStandard = Old_Standard_TT({ variable: "--font-old-standard", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const franklin = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Will it Material?",
  description: "Test materials against extreme environments and find better alternatives. A conceptual screening tool.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oldStandard.variable} ${franklin.variable}`}>
      <body className="antialiased">
        <div className="relative z-10 flex min-h-dvh flex-col overflow-x-clip">
          <div className="flex-1">{children}</div>
          <footer className="mx-auto w-full max-w-6xl px-4 pb-6 pt-10 sm:px-6">
            <Disclaimer />
          </footer>
        </div>
      </body>
    </html>
  );
}
