"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

const links = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg font-semibold text-ink-950">
          {siteConfig.name}
          <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-accent-700">
            UI demo
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-ink-600 transition-colors hover:text-ink-950",
                pathname.startsWith(link.href) && "font-medium text-ink-950",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/dashboard" variant="outline" size="sm">
            Dashboard
          </ButtonLink>
          <ButtonLink href="/quote" size="sm">
            Get a quote
          </ButtonLink>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-ink-700 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-ink-100 bg-white lg:hidden">
          <nav aria-label="Mobile" className="container flex flex-col py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm text-ink-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-3">
              <ButtonLink
                href="/dashboard"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </ButtonLink>
              <ButtonLink href="/quote" className="flex-1" onClick={() => setOpen(false)}>
                Get a quote
              </ButtonLink>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
