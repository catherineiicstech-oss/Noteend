import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className={cn("py-16 sm:py-20", className)} {...props}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-ink-600">{description}</p> : null}
    </div>
  );
}

export function FeatureCard({
  title,
  description,
  href,
  meta,
}: {
  title: string;
  description: string;
  href?: string;
  meta?: string;
}) {
  const body = (
    <div className="flex h-full flex-col rounded-xl border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-lg">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-600">{description}</p>
      {meta ? <p className="mt-4 text-xs font-medium text-accent-700">{meta}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
