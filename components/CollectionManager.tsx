"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  createCollectionAction,
  deleteCollectionAction,
  renameCollectionAction,
  setActiveCollectionAction,
} from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import SubmitButton from "./SubmitButton";
import ConfirmSubmitButton from "./ConfirmSubmitButton";

export interface CollectionSummary {
  id: string;
  name: string;
  cardCount: number;
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
  isActive,
  canDelete,
}: {
  collection: CollectionSummary;
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
    <div className="surface space-y-2 p-3">
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
      {collections.map((c) => (
        <CollectionRow
          key={c.id}
          collection={c}
          isActive={c.id === activeId}
          canDelete={collections.length > 1}
        />
      ))}
    </div>
  );
}
