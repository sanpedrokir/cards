"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { purchaseCard, analyzeCardPhoto } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, todayIso } from "@/lib/format";
import SubmitButton from "./SubmitButton";

export default function PurchaseForm({
  availableBalance,
  currency,
}: {
  availableBalance: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(purchaseCard, initialFormState);
  const [isScanning, startScan] = useTransition();
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const seriesRef = useRef<HTMLInputElement>(null);
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const gradeRef = useRef<HTMLInputElement>(null);
  const gradingCompanyRef = useRef<HTMLInputElement>(null);
  const certNumberRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  // Tracks which fields currently hold a value from a *previous* scan (as
  // opposed to something the user typed themselves), so a re-scan can clear
  // stale auto-filled values without ever touching user-typed input.
  const autoFilledRef = useRef<Set<string>>(new Set());

  const fieldRefs = {
    name: nameRef,
    series: seriesRef,
    cardNumber: cardNumberRef,
    grade: gradeRef,
    gradingCompany: gradingCompanyRef,
    certNumber: certNumberRef,
  } as const;

  function handleFileChange() {
    const file = imageInputRef.current?.files?.[0];
    setFileName(file?.name ?? null);
    if (!file) return;

    setScanError(null);
    setScanNotice(null);

    // Clear only fields that came from a previous scan -- never clobber
    // something the user typed in by hand.
    for (const key of autoFilledRef.current) {
      const ref = fieldRefs[key as keyof typeof fieldRefs];
      if (ref?.current) ref.current.value = "";
    }
    autoFilledRef.current.clear();

    startScan(async () => {
      const formData = new FormData();
      formData.set("image", file);
      const result = await analyzeCardPhoto(formData);

      if (result.error) {
        setScanError(result.error);
        return;
      }

      for (const key of Object.keys(fieldRefs) as (keyof typeof fieldRefs)[]) {
        const value = result[key];
        const ref = fieldRefs[key];
        if (value && ref.current) {
          ref.current.value = value;
          autoFilledRef.current.add(key);
        }
      }

      if (detailsRef.current) detailsRef.current.open = true;
      setScanNotice("Verify details before saving!");
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        Available balance:{" "}
        <span className="font-semibold">
          {formatMoney(availableBalance, currency)}
        </span>
      </div>

      <fieldset className="space-y-4">
        <div>
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Photo
          </span>
          <div className="mt-1 flex items-center gap-3">
            <label
              htmlFor="image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Upload/Scan
            </label>
            <input
              ref={imageInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {fileName ?? "No file chosen"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Take a photo with your camera, or upload one from a scanner app --
            we&apos;ll automatically fill in the fields below.
          </p>
          {isScanning && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Scanning…</p>
          )}
          {scanError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{scanError}</p>
          )}
          {scanNotice && !scanError && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              {scanNotice}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Card Name *
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            type="text"
            required
            placeholder="2023 Pokémon Charizard PSA 10"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Purchase Price *
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="850.00"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Purchase Date
            </span>
            <div className="mt-1 flex h-[46px] w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              {formatDate(todayIso())}
            </div>
          </div>
        </div>
      </fieldset>

      <details ref={detailsRef} open className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          More details (optional)
        </summary>
        <fieldset className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="Pokémon"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="series" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Set / Series
              </label>
              <input
                ref={seriesRef}
                id="series"
                name="series"
                type="text"
                placeholder="Base Set"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Card Number
            </label>
            <input
              ref={cardNumberRef}
              id="cardNumber"
              name="cardNumber"
              type="text"
              placeholder="4/102"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Grade
              </label>
              <input
                ref={gradeRef}
                id="grade"
                name="grade"
                type="text"
                placeholder="0 if ungraded"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="gradingCompany" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Grading Company
              </label>
              <input
                ref={gradingCompanyRef}
                id="gradingCompany"
                name="gradingCompany"
                type="text"
                placeholder="PSA"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="certNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Cert / Serial # (PSA)
            </label>
            <input
              ref={certNumberRef}
              id="certNumber"
              name="certNumber"
              type="text"
              placeholder="115823198"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </fieldset>
      </details>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full">Add Card</SubmitButton>
    </form>
  );
}
