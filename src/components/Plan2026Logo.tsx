import Image from "next/image";
import Link from "next/link";

/** Logo asset: `public/plan2026-logo-c.png` was trimmed in GIMP to remove transparent padding (TECH-0033). */
type Plan2026LogoProps = {
  href?: string;
  className?: string;
  iconClassName?: string;
  /** Translated "Go to plans" for aria-label. */
  ariaLabel?: string;
};

export function Plan2026Logo({
  href = "/plans",
  className,
  iconClassName,
  ariaLabel = "Go to plans",
}: Plan2026LogoProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500 ${className ?? ""}`}
    >
      <span
        className={`relative flex shrink-0 overflow-hidden rounded-lg ${iconClassName ?? "h-16 w-24"}`}
      >
        <Image
          src="/plan2026-logo-c.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="96px"
          className="object-contain object-center"
          priority
        />
      </span>
    </Link>
  );
}
