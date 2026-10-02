"use client";

import { useState } from "react";
import { CardPlaceholderIcon } from "./icons";

export default function CardImage({
  src,
  alt,
  className = "h-32 w-24 rounded-xl",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!src) {
    return (
      <div
        className={`relative ${className} shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-amber-50 dark:from-slate-500/15 dark:to-amber-500/10`}
      >
        <div className="flex h-full w-full items-center justify-center">
          <CardPlaceholderIcon className="h-1/2 w-1/2" />
        </div>
      </div>
    );
  }

  function openLightbox(e: React.SyntheticEvent) {
    // Card photos often sit inside a larger clickable row/link (e.g. a card
    // tile that navigates to the detail page) -- stop that click here so
    // tapping the photo zooms it instead of triggering the outer link.
    e.preventDefault();
    e.stopPropagation();
    setExpanded(true);
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={openLightbox}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openLightbox(e);
        }}
        aria-label={`View larger photo of ${alt}`}
        className={`relative ${className} shrink-0 cursor-pointer overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </span>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[80vh] max-w-sm rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  );
}
