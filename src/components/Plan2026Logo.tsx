import Image from "next/image";
import Link from "next/link";

type Plan2026LogoProps = {
  href?: string;
  className?: string;
  iconClassName?: string;
};

export function Plan2026Logo({
  href = "/plans",
  className,
  iconClassName,
}: Plan2026LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Go to plans"
      className={`inline-flex items-center justify-center rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-300 ${className ?? ""}`}
    >
      <span
        className={`relative flex h-16 w-24 items-center justify-center ${iconClassName ?? ""}`}
      >
        <Image
          src="/plan2026-logo-c.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="96px"
          className="object-contain"
          priority
        />
      </span>
    </Link>
  );
}
