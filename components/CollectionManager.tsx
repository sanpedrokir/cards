"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  createCollectionAction,
  deleteCollectionAction,
  removeCollectionIconAction,
  renameCollectionAction,
  setActiveCollectionAction,
  setCollectionIconAction,
} from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import SubmitButton from "./SubmitButton";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import CollectionAvatar from "./CollectionAvatar";

export interface CollectionSummary {
  id: string;
  name: string;
  cardCount: number;
  iconUrl?: string;
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-1.8A1 1 0 0 1 9.5 4.7h5a1 1 0 0 1 .8.5L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth={1.8} />
    </svg>
  );
}

const ICON_SIZE = 192;

// An icon is only ever shown as a small circle, so shrink the chosen picture
// to a centred square right here on the phone before uploading. That makes a
// multi-megabyte camera photo upload as a few KB. If the browser can't decode
// the file (e.g. some HEIC photos), fall back to sending it untouched and let
// the server try.
async function shrinkToIcon(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      ICON_SIZE,
      ICON_SIZE
    );
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    return blob ? new File([blob], "icon.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

// Tap the avatar to pick a picture; it uploads as soon as one is chosen.
function IconPicker({ collection, index }: { collection: CollectionSummary; index: number }) {
  const [state, formAction, isPending] = useActionState(
    setCollectionIconAction,
    initialFormState
  );

  return (
    <div className="shrink-0">
      <form action={formAction}>
        <input type="hidden" name="collectionId" value={collection.id} />
        <label
          className={`relative block h-14 w-14 cursor-pointer ${isPending ? "opacity-50" : ""}`}
          title="Change picture"
        >
          <CollectionAvatar
            name={collection.name}
            iconUrl={collection.iconUrl}
            index={index}
            className="h-14 w-14 text-xl"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#12212b] text-slate-200">
            <CameraIcon />
          </span>
          <input
            type="file"
            name="icon"
            accept="image/*"
            className="sr-only"
            aria-label={`Choose a picture for ${collection.name}`}
            onChange={async (e) => {
              const input = e.currentTarget;
              const form = input.form;
              const picked = input.files?.[0];
              if (!form || !picked) return;
              const small = await shrinkToIcon(picked);
              if (small !== picked) {
                const transfer = new DataTransfer();
                transfer.items.add(small);
                input.files = transfer.files;
              }
              form.requestSubmit();
            }}
          />
        </label>
      </form>
      {state?.error && <p className="mt-1 max-w-[10rem] text-[11px] text-rose-400">{state.error}</p>}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function NewCollectionForm({ atLimit, limit }: { atLimit: boolean; limit: number | null }) {
  const [state, formAction] = useActionState(createCollectionAction, initialFormState);

  if (atLimit) {
    return (
      <div className="surface space-y-2 p-4">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Collection limit reached
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Free accounts can have up to {limit} collections. Subscribe for
          unlimited collections.
        </p>
        <Link href="/pricing" className="btn-primary-sm">
          See plans
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface space-y-2 p-3">
      <label htmlFor="new-collection-name" className="label-field">
        New collection
      </label>
      <div className="flex items-center gap-2">
        <input
          id="new-collection-name"
          name="name"
          type="text"
          required
          maxLength={40}
          placeholder="e.g. Pokemon, Sports cards"
          className="input-field mt-0 py-2"
        />
        <SubmitButton small>Add</SubmitButton>
      </div>
      {state?.error && <p className="notice-error">{state.error}</p>}
    </form>
  );
}

function CollectionRow({
  collection,
  index,
  isActive,
  canDelete,
}: {
  collection: CollectionSummary;
  index: number;
  isActive: boolean;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, startSwitching] = useTransition();

  async function handleRename(formData: FormData) {
    const result = await renameCollectionAction(initialFormState, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setError(null);
      setEditing(false);
    }
  }

  function stopEditing() {
    setEditing(false);
    setError(null);
  }

  return (
    <div className="surface flex items-start gap-3 p-3">
      <IconPicker collection={collection} index={index} />
      <div className="min-w-0 flex-1 space-y-2">
      {editing ? (
        <form action={handleRename} className="flex items-center gap-2">
          <input type="hidden" name="collectionId" value={collection.id} />
          <input
            name="name"
            type="text"
            required
            maxLength={40}
            defaultValue={collection.name}
            aria-label="Collection name"
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Escape") stopEditing();
            }}
            className="input-field mt-0 py-1.5"
          />
          <button type="submit" aria-label="Save name" className="btn-icon-primary">
            <CheckIcon />
          </button>
          <button type="button" onClick={stopEditing} aria-label="Cancel" className="btn-icon">
            <CloseIcon />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5">
          <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-white">
            {collection.name}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${collection.name}`}
            className="btn-ghost-icon shrink-0"
          >
            <PencilIcon />
          </button>
        </div>
      )}
      {error && <p className="notice-error">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {collection.cardCount} {collection.cardCount === 1 ? "card" : "cards"}
          {isActive && (
            <span className="ml-2 font-semibold text-amber-700 dark:text-amber-400">
              · Current
            </span>
          )}
        </span>

        <div className="flex items-center gap-4">
          {!isActive && (
            <button
              type="button"
              disabled={isSwitching}
              onClick={() =>
                startSwitching(async () => {
                  await setActiveCollectionAction(collection.id);
                })
              }
              className="link-muted"
            >
              Switch to this
            </button>
          )}
          {collection.iconUrl && (
            <form action={removeCollectionIconAction.bind(null, collection.id)}>
              <button type="submit" className="link-muted">
                Remove picture
              </button>
            </form>
          )}
          {canDelete && (
            <form action={deleteCollectionAction.bind(null, collection.id)}>
              <ConfirmSubmitButton
                triggerLabel="Delete"
                triggerClassName="text-sm font-medium text-rose-600 underline-offset-2 hover:underline dark:text-rose-400"
                title={`Delete "${collection.name}"?`}
                message={`This permanently deletes the collection and all ${collection.cardCount} of its cards, sales and budget. This cannot be undone.`}
                confirmLabel="Delete collection"
                danger
              />
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function CollectionManager({
  collections,
  activeId,
  limit,
}: {
  collections: CollectionSummary[];
  activeId: string;
  limit: number | null;
}) {
  return (
    <div className="space-y-3">
      <NewCollectionForm
        atLimit={limit !== null && collections.length >= limit}
        limit={limit}
      />
      {collections.map((c, i) => (
        <CollectionRow
          key={c.id}
          index={i}
          collection={c}
          isActive={c.id === activeId}
          canDelete={collections.length > 1}
        />
      ))}
    </div>
  );
}
