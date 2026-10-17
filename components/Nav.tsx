"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
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
    label: "Add Card",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
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
    label: "Sell",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
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
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
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
    href: "/account",
    label: "Account",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
        <path
          d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
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
  // Phone-only accounts have no email, so fall back to the phone number.
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.primaryPhoneNumber?.phoneNumber;

  // "/cards" is a prefix of "/cards/new", so a plain startsWith() check would
  // light up both "Vaulted Cards" and "Add Card" at once. Instead, pick the
  // single most specific (longest) matching href and only mark that one active.
  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const activeHref = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => matches(item.href))?.href;

  // Instant feedback: the tapped tab lights up and a slim bar runs along the
  // top right away, instead of nothing happening until the server answers.
  // "pending" remembers which page it was started from, so it clears itself
  // the moment the pathname changes (no effect needed).
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = pending && pending.from === pathname ? pending.href : null;
  const isActive = (href: string) => href === (pendingHref ?? activeHref);

  function startNav(href: string) {
    if (href === pathname) return;
    setPending({ href, from: pathname });
    // Safety net so the bar can't spin forever if a navigation never lands.
    setTimeout(() => setPending(null), 8000);
  }

  function handleSignOut() {
    signOut(() => router.push("/sign-in"));
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#060d13]">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vaulted-logo.png" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="font-bold text-slate-900 dark:text-white">Vaulted</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {pendingHref && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-emerald-300/10">
          <div className="h-full w-1/3 animate-[nav-progress_0.9s_ease-in-out_infinite] will-change-transform bg-gradient-to-r from-emerald-300 to-sky-400" />
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#060d13] sm:hidden">
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
          <Link
            href="/account"
            className="block border-t border-slate-100 px-4 py-1 text-center text-[11px] text-slate-400 dark:border-white/5 dark:text-slate-500"
          >
            {email}
          </Link>
        )}
      </header>

      <header className="sticky top-0 z-40 hidden border-b border-slate-200/70 bg-white sm:block dark:border-white/10 dark:bg-[#060d13]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vaulted-logo.png" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="font-bold text-slate-900 dark:text-white">Vaulted</span>
          </Link>
          {email && (
            <Link href="/account" className="text-xs text-slate-400 hover:underline dark:text-slate-500">
              {email}
            </Link>
          )}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => startNav(item.href)}
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-white/10 dark:bg-[#08121a]">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => startNav(item.href)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <span
                  className={`rounded-full px-4 py-1 transition-colors ${
                    active ? "bg-amber-400/15" : ""
                  }`}
                >
                  {item.icon(active)}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
