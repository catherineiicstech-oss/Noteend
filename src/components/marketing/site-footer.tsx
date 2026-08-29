import Link from "next/link";
import { siteConfig } from "@/lib/site";

const columns = [
  {
    heading: "Services",
    links: [
      { href: "/services", label: "All services" },
      { href: "/services#editing", label: "Editing & proofreading" },
      { href: "/services#research", label: "Research & writing" },
      { href: "/services#documentation", label: "Business documentation" },
      { href: "/quote", label: "Request a quote" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/industries", label: "Industries" },
      { href: "/resources", label: "Resources" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/confidentiality", label: "Confidentiality" },
      { href: "/legal/refunds", label: "Refund policy" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-ink-50">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink-950">{siteConfig.name}</p>
          <p className="mt-3 max-w-xs text-sm text-ink-600">{siteConfig.tagline}</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-ink-600">
            <p>{siteConfig.addressLocality}, Uganda</p>
            <p>
              <a className="hover:text-ink-900" href={`mailto:${siteConfig.contactEmail}`}>
                {siteConfig.contactEmail}
              </a>
            </p>
            <p>
              <a className="hover:text-ink-900" href={`tel:${siteConfig.contactPhone}`}>
                {siteConfig.contactPhone}
              </a>
            </p>
          </address>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <p className="text-sm font-semibold text-ink-900">{column.heading}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link className="text-sm text-ink-600 hover:text-ink-900" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-200/70">
        <div className="container flex flex-col gap-2 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Documents are handled under signed confidentiality terms.</p>
        </div>
      </div>
    </footer>
  );
}
