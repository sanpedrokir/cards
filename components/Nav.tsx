"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 12 12 4l8 8M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/cards",
    label: "My Cards",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect
          x="3.5"
          y="5.5"
          width="17"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
        />
        <path
          d="M3.5 9.5h17"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
        />
      </svg>
    ),
  },
  {
    href: "/cards/new",
    label: "Purchase",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
        />
        <path
          d="M12 8v8M8 12h8"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/investment",
    label: "Investment",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M3 7.5h18M3 7.5v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M3 7.5l2.5-3.5h13L21 7.5"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      </svg>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-zinc-200 bg-white/80 backdrop-blur sm:block dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Card Tracker
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
