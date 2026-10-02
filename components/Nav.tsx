"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

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
    href: "/sales",
    label: "Sales",
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
  {
    href: "/cards",
    label: "Vaulted Cards",
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
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function handleSignOut() {
    signOut(() => router.push("/sign-in"));
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vaulted-logo.png" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Vaulted
            </span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/80 sm:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="w-12" />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vaulted-logo.png" alt="Vaulted" className="h-8 w-8 rounded-lg shadow-sm" />
          </Link>
          <button
            onClick={handleSignOut}
            className="w-12 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            Sign out
          </button>
        </div>
        {email && (
          <div className="border-t border-slate-100 px-4 py-1 text-center text-[11px] text-slate-400 dark:border-white/5 dark:text-slate-500">
            {email}
          </div>
        )}
      </header>

      <header className="sticky top-0 z-40 hidden border-b border-slate-200/70 bg-white/80 backdrop-blur sm:block dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vaulted-logo.png" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Vaulted
            </span>
          </Link>
          {email && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{email}</span>
          )}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "pill-active" : "pill"}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-white/10 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400"
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
