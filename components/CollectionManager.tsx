"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
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
    <form action={formAction} className="surface space-y-3 p-4">
      <label htmlFor="new-collection-name" className="label-field">
        New collection
      </label>
      <div className="flex gap-2">
        <input
          id="new-collection-name"
          name="name"
          type="text"
          required
          maxLength={40}
          placeholder="e.g. Pokemon, Sports cards"
          className="input-field"
        />
        <SubmitButton>Add</SubmitButton>
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
  const [state, renameAction] = useActionState(renameCollectionAction, initialFormState);
  const [isSwitching, startSwitching] = useTransition();

  return (
    <div className="surface space-y-3 p-4">
      <form action={renameAction} className="flex gap-2">
        <input type="hidden" name="collectionId" value={collection.id} />
        <input
          name="name"
          type="text"
          required
          maxLength={40}
          defaultValue={collection.name}
          aria-label="Collection name"
          className="input-field"
        />
        <SubmitButton>Rename</SubmitButton>
      </form>
      {state?.error && <p className="notice-error">{state.error}</p>}

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
    <div className="space-y-4">
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
