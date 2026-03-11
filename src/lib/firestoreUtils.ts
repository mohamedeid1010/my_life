/**
 * ═══════════════════════════════════════════════════════════
 *  Firestore Safe Write Utilities — Shield 3: Data Integrity
 * ═══════════════════════════════════════════════════════════
 *
 *  USE THESE FUNCTIONS for all Firestore writes throughout
 *  the Horizon app. They prevent the "Silent Data Overwrite"
 *  bug where undefined/null values or a bare setDoc() call
 *  can silently delete fields that weren't included in the
 *  payload.
 *
 *  Quick reference:
 *  ┌─────────────┬──────────────────────────────────────────────┐
 *  │ safeUpdate  │ Update existing doc — NEVER deletes fields   │
 *  │ safeMerge   │ Upsert (create or update) — safe merge mode  │
 *  │ safeSet     │ Create new doc from scratch (use sparingly)  │
 *  └─────────────┴──────────────────────────────────────────────┘
 */

import {
  doc,
  updateDoc,
  setDoc,
  DocumentReference,
  DocumentData,
  SetOptions,
} from 'firebase/firestore';

export type SafeData = Record<string, unknown>;


/* ─────────────── Core Guard ─────────────── */

/**
 * Strips keys whose value is `undefined` or `null` from the payload.
 * Firestore rejects `undefined` and writing `null` can unintentionally
 * clear a field. Returns a clean copy — never mutates the original.
 *
 * Also returns the list of stripped keys so callers can log a warning.
 */
function stripInvalidValues(data: SafeData): {
  clean: SafeData;
  stripped: string[];
} {
  const clean: SafeData = {};
  const stripped: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      stripped.push(key);
    } else {
      clean[key] = value;
    }
  }

  return { clean, stripped };
}


/* ─────────────── safeUpdate ─────────────── */

/**
 * **Safe replacement for `updateDoc`.**
 *
 * - ✅ Only updates the fields you provide — existing fields are untouched.
 * - ✅ Strips `undefined` / `null` values before writing.
 * - ✅ Warns in console if fields were stripped or if payload is empty.
 * - ❌ Will throw if the document does not exist (use `safeMerge` for upsert).
 *
 * @example
 * await safeUpdate(doc(db, 'users', uid), { xp: newXp, level: undefined });
 * // → Writes only { xp: newXp }. 'level: undefined' is silently dropped.
 */
export async function safeUpdate(
  ref: DocumentReference<DocumentData>,
  data: SafeData
): Promise<void> {
  const context = `[safeUpdate → ${ref.path}]`;
  const { clean, stripped } = stripInvalidValues(data);

  if (stripped.length > 0) {
    console.warn(
      `${context} Stripped ${stripped.length} undefined/null field(s):`,
      stripped
    );
  }

  if (Object.keys(clean).length === 0) {
    console.warn(
      `${context} No valid fields to write after stripping. ` +
      `Skipping Firestore write to prevent empty update.`
    );
    return;
  }

  await updateDoc(ref, clean);
}


/* ─────────────── safeMerge ─────────────── */

/**
 * **Safe upsert (create-or-update) using `setDoc(..., { merge: true })`.**
 *
 * - ✅ Creates the document if it doesn't exist.
 * - ✅ Updates only the provided fields if it does exist — no field deletions.
 * - ✅ Strips `undefined` / `null` values before writing.
 *
 * Use this when you aren't sure if a document exists (e.g., first login).
 *
 * @example
 * await safeMerge(doc(db, 'users', uid), { displayName: 'Mohamed', score: null });
 * // → Writes only { displayName: 'Mohamed' }. null 'score' is dropped.
 */
export async function safeMerge(
  ref: DocumentReference<DocumentData>,
  data: SafeData
): Promise<void> {
  const context = `[safeMerge → ${ref.path}]`;
  const { clean, stripped } = stripInvalidValues(data);

  if (stripped.length > 0) {
    console.warn(
      `${context} Stripped ${stripped.length} undefined/null field(s):`,
      stripped
    );
  }

  if (Object.keys(clean).length === 0) {
    console.warn(`${context} No valid fields to write. Skipping.`);
    return;
  }

  await setDoc(ref, clean, { merge: true } as SetOptions);
}


/* ─────────────── safeSet ─────────────── */

/**
 * **Safe full document creation using `setDoc` (NO merge).**
 *
 * - ✅ Intended for brand-new documents only (e.g., creating a user profile).
 * - ✅ Strips `undefined` / `null` values before writing.
 * - ⚠️  OVERWRITES the entire document. All existing fields not in `data`
 *       will be permanently deleted. Use `safeUpdate` or `safeMerge` instead
 *       unless you explicitly intend a full overwrite.
 *
 * @example
 * await safeSet(doc(db, 'users', uid), { displayName: 'New User', xp: 0 });
 */
export async function safeSet(
  ref: DocumentReference<DocumentData>,
  data: SafeData
): Promise<void> {
  const context = `[safeSet → ${ref.path}]`;
  const { clean, stripped } = stripInvalidValues(data);

  if (stripped.length > 0) {
    console.warn(
      `${context} Stripped ${stripped.length} undefined/null field(s):`,
      stripped
    );
  }

  if (Object.keys(clean).length === 0) {
    throw new Error(
      `${context} Cannot create a document with no valid fields. ` +
      `All provided values were undefined or null.`
    );
  }

  await setDoc(ref, clean);
}
