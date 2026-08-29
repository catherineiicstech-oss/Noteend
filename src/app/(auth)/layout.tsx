import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="font-display text-lg font-semibold text-ink-950">
            {siteConfig.name}
          </Link>
        </div>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
