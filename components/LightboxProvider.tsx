"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface LightboxImage {
  src: string;
  alt: string;
}

const LightboxContext = createContext<((image: LightboxImage) => void) | null>(null);

export function useLightbox(): (image: LightboxImage) => void {
  const open = useContext(LightboxContext);
  if (!open) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return open;
}

export default function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<LightboxImage | null>(null);

  // A stable function reference so consumers don't need it in dependency
  // arrays, and so there's only ever one open image tracked app-wide --
  // opening a new one simply replaces it instead of stacking another on top.
  const open = useMemo(() => (next: LightboxImage) => setImage(next), []);

  return (
    <LightboxContext.Provider value={open}>
      {children}

      {image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="max-h-[80vh] max-w-sm rounded-xl shadow-2xl"
          />
        </div>
      )}
    </LightboxContext.Provider>
  );
}
