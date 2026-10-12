"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// On-screen latency readout, off by default. Open any page with ?perf=1 to
// turn it on (it stays on for this browser); ?perf=0 turns it off again.
//
// For each tap on a link it shows:
//   server  - time the server took to start answering (the "waiting" part)
//   fetch   - total time to download the page data
//   shown   - tap until the new page was actually painted on screen
// A big "server" means the server/database is slow; a big "shown" with a small
// fetch means the phone is slow to render; a big gap before either means the
// network round trip itself is slow.

const KEY = "vaulted_perf";
type Row = { id: number; label: string; server?: number; fetch?: number; shown?: number };

function readEnabled(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get("perf");
    if (flag === "1") window.localStorage.setItem(KEY, "1");
    if (flag === "0") window.localStorage.removeItem(KEY);
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export default function PerfMeter() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const tap = useRef<{ id: number; t0: number; label: string } | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    const on = readEnabled();
    const t = setTimeout(() => setEnabled(on), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function patch(id: number, change: Partial<Row>) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));
    }

    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.origin !== window.location.origin || a.pathname === window.location.pathname)
        return;
      const id = ++counter.current;
      const label = a.pathname + a.search;
      tap.current = { id, t0: performance.now(), label };
      setRows((prev) => [{ id, label }, ...prev].slice(0, 5));
    }

    const observer = new PerformanceObserver((list) => {
      const t = tap.current;
      if (!t) return;
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        if (!entry.name.includes("_rsc=") || entry.startTime < t.t0 - 50) continue;
        patch(t.id, {
          server: Math.round(entry.responseStart - entry.requestStart),
          fetch: Math.round(entry.responseEnd - entry.startTime),
        });
      }
    });
    try {
      observer.observe({ type: "resource", buffered: false });
    } catch {
      /* resource timing unavailable */
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      observer.disconnect();
    };
  }, [enabled]);

  // The path changed: the new page committed. Wait two frames for the paint.
  useEffect(() => {
    const t = tap.current;
    if (!enabled || !t) return;
    tap.current = null;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const shown = Math.round(performance.now() - t.t0);
        setRows((prev) => prev.map((r) => (r.id === t.id ? { ...r, shown } : r)));
      })
    );
  }, [pathname, enabled]);

  if (!enabled) return null;

  const ms = (n?: number) => (n === undefined ? "…" : `${n}ms`);

  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-20 z-50 rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-4 text-emerald-300 sm:bottom-2 sm:left-auto sm:w-80">
      <div className="mb-1 text-slate-400">perf (?perf=0 to hide)</div>
      {rows.length === 0 && <div>Tap a menu item…</div>}
      {rows.map((r) => (
        <div key={r.id}>
          {r.label} · server {ms(r.server)} · fetch {ms(r.fetch)} · shown {ms(r.shown)}
        </div>
      ))}
    </div>
  );
}
