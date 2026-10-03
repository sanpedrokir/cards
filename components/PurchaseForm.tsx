"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import {
  purchaseCard,
  analyzeCardPhoto,
  checkEbayPriceForQuery,
  type EbayPriceEstimate,
} from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import { formatMoney, formatDate, todayIso } from "@/lib/format";
import SubmitButton from "./SubmitButton";
import CardImage from "./CardImage";

export default function PurchaseForm({
  availableBalance,
  currency,
}: {
  availableBalance: number | null;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Tracks which fields currently hold a value from a *previous* scan (as
  // opposed to something the user typed themselves), so a re-scan can clear
  // stale auto-filled values without ever touching user-typed input.
  const autoFilledRef = useRef<Set<string>>(new Set());

  const [ebayResult, setEbayResult] = useState<EbayPriceEstimate | null>(null);
  const [isCheckingEbay, startEbayCheck] = useTransition();

  function handleCheckEbay() {
    const name = nameRef.current?.value ?? "";
    startEbayCheck(async () => {
      const result = await checkEbayPriceForQuery(
        name,
        gradingCompanyRef.current?.value,
        gradeRef.current?.value
      );
      setEbayResult(result);
    });
  }

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
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
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
      {availableBalance !== null ? (
        <div className="notice-info">
          Available balance:{" "}
          <span className="font-semibold">
            {formatMoney(availableBalance, currency)}
          </span>
        </div>
      ) : (
        <div className="notice-neutral">
          {"No spending budget set — this purchase won't be limited. "}
          <Link href="/investment" className="font-medium underline">
            Set one up (optional)
          </Link>
        </div>
      )}

      <fieldset className="space-y-4">
        <div>
          <span className="label-field">
            Photo
          </span>
          <div className="mt-1 flex items-center gap-3">
            <label
              htmlFor="image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm shadow-amber-500/25 transition-all hover:brightness-105"
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
            <span className="truncate text-sm text-slate-500 dark:text-slate-400">
              {fileName ?? "No file chosen"}
            </span>
          </div>
          {previewUrl && (
            <div className="mt-2">
              <CardImage
                src={previewUrl}
                alt="Selected card photo"
                className="h-24 w-20 rounded-xl"
              />
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Take a photo with your camera, or upload one from a scanner app --
            we&apos;ll automatically fill in the fields below.
          </p>
          {isScanning && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Scanning…</p>
          )}
          {scanError && (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{scanError}</p>
          )}
          {scanNotice && !scanError && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              {scanNotice}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="label-field">
            Card Name *
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            type="text"
            required
            placeholder="2023 Pokémon Charizard PSA 10"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchasePrice" className="label-field">
              Purchase Price *
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="input-field"
            />
          </div>
          <div>
            <span className="label-field">
              Purchase Date
            </span>
            <div className="mt-1 flex h-[46px] w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {formatDate(todayIso())}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                eBay Market Check
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                See if you&apos;re paying a fair price.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckEbay}
              disabled={isCheckingEbay}
              className="btn-chip"
            >
              {isCheckingEbay ? "Checking…" : "Check eBay Price"}
            </button>
          </div>

          {ebayResult?.error && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{ebayResult.error}</p>
          )}

          {ebayResult && !ebayResult.error && (
            <div className="mt-3 space-y-3">
              {ebayResult.recommendedPrice !== undefined && (
                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Typical market price
                  </p>
                  <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                    {formatMoney(ebayResult.recommendedPrice, ebayResult.currency ?? "USD")}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                    Based on {ebayResult.listings.length} similar active eBay listing
                    {ebayResult.listings.length === 1 ? "" : "s"}. Guideline only.
                  </p>
                </div>
              )}

              <ul className="space-y-1.5 text-sm">
                {ebayResult.listings.map((listing, i) => (
                  <li key={i}>
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {listing.title}
                      </span>
                      <span className="shrink-0 font-medium text-slate-900 dark:text-white">
                        {formatMoney(listing.price, listing.currency)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </fieldset>

      <details ref={detailsRef} open className="group rounded-xl border border-slate-200 dark:border-white/10">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          More details (optional)
        </summary>
        <fieldset className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="label-field">
                Category
              </label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="Pokémon"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="series" className="label-field">
                Set / Series
              </label>
              <input
                ref={seriesRef}
                id="series"
                name="series"
                type="text"
                placeholder="Base Set"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cardNumber" className="label-field">
              Card Number
            </label>
            <input
              ref={cardNumberRef}
              id="cardNumber"
              name="cardNumber"
              type="text"
              placeholder="4/102"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade" className="label-field">
                Grade
              </label>
              <input
                ref={gradeRef}
                id="grade"
                name="grade"
                type="text"
                placeholder="0 if ungraded"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="gradingCompany" className="label-field">
                Grading Company
              </label>
              <input
                ref={gradingCompanyRef}
                id="gradingCompany"
                name="gradingCompany"
                type="text"
                placeholder="PSA"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="certNumber" className="label-field">
              Cert / Serial # (PSA)
            </label>
            <input
              ref={certNumberRef}
              id="certNumber"
              name="certNumber"
              type="text"
              placeholder="115823198"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="notes" className="label-field">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input-field"
            />
          </div>
        </fieldset>
      </details>

      {state?.error && <p className="notice-error">{state.error}</p>}

      <SubmitButton className="w-full">Add Card</SubmitButton>
    </form>
  );
}
