"use client";

import { useState } from "react";
import { CardPlaceholderIcon } from "./icons";

export default function CardImage({ src, alt }: { src?: string; alt: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!src) {
    return (
      <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-amber-50 dark:from-slate-500/15 dark:to-amber-500/10">
        <div className="flex h-full w-full items-center justify-center">
          <CardPlaceholderIcon className="h-12 w-12" />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={`View larger photo of ${alt}`}
        className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-sm rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
