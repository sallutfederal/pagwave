import { cn } from "@/lib/utils";

type IconProps = {
  href: string;
  active?: boolean;
  className?: string;
};

/**
 * Minimalist, hairline geometric SVG icons (1.6px stroke) tailored for a clean fintech sidebar.
 */
export function SidebarNavIcon({ href, active = false, className }: IconProps) {
  const base = cn(
    "size-[17px] shrink-0 transition-colors duration-150",
    className,
  );
  const sw = active ? "1.85" : "1.6";

  switch (href) {
    case "/dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <rect x="3.5" y="3.5" width="7" height="9" rx="2" stroke="currentColor" strokeWidth={sw} />
          <rect x="13.5" y="3.5" width="7" height="5.5" rx="2" stroke="currentColor" strokeWidth={sw} />
          <rect x="13.5" y="12" width="7" height="8.5" rx="2" stroke="currentColor" strokeWidth={sw} />
          <rect x="3.5" y="15.5" width="7" height="5" rx="2" stroke="currentColor" strokeWidth={sw} />
        </svg>
      );

    case "/wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <rect x="3" y="5.5" width="18" height="13.5" rx="3" stroke="currentColor" strokeWidth={sw} />
          <path d="M3 9.5h18" stroke="currentColor" strokeWidth={sw} strokeOpacity="0.45" />
          <circle cx="16.5" cy="14" r="1.15" fill="currentColor" />
        </svg>
      );

    case "/cards":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="2.75" stroke="currentColor" strokeWidth={sw} />
          <path d="M2.5 10h19" stroke="currentColor" strokeWidth={sw} />
          <path d="M6.5 14.5h3.5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );

    case "/transactions":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M7 8.5h10.5m0 0-3-3m3 3-3 3M17 15.5H6.5m0 0 3-3m-3 3 3 3"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "/integrations":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M8.5 8.5h7v7h-7z"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path
            d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );

    case "/admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M12 3.2 5 6.2v5c0 4.5 3 8.4 7 9.6 4-1.2 7-5.1 7-9.6v-5l-7-3Z"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </svg>
      );

    case "/admin/users":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth={sw} />
          <path
            d="M4 18.5c.8-2.8 3.2-4.5 6-4.5s5.2 1.7 6 4.5"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <path
            d="m16.5 11.5 1.3 1.3 2.7-2.8"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "/admin/transactions":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M4 12h3.5l2.2-5 3.6 10 2.2-5H20"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "/admin/integrations":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <circle cx="8" cy="12" r="3.6" stroke="currentColor" strokeWidth={sw} />
          <path
            d="M11.6 12H20m-2.5 0v2.5M14.8 12v2"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );

    case "/admin/settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M4 7.5h16M4 12h16M4 16.5h16"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <circle cx="9" cy="7.5" r="1.8" fill="#090a0e" stroke="currentColor" strokeWidth={sw} />
          <circle cx="15" cy="12" r="1.8" fill="#090a0e" stroke="currentColor" strokeWidth={sw} />
          <circle cx="10.5" cy="16.5" r="1.8" fill="#090a0e" stroke="currentColor" strokeWidth={sw} />
        </svg>
      );

    case "/fees":
    case "/admin/fees":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <path
            d="M17.5 6.5 6.5 17.5"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth={sw} />
          <circle cx="16" cy="16" r="2.25" stroke="currentColor" strokeWidth={sw} />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className={base}>
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth={sw} />
        </svg>
      );
  }
}
