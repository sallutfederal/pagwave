"use client";

import { useSyncExternalStore } from "react";

import { userProfile } from "@/data/user-profile";

const STORAGE_KEY = "pagwave:profile";
const CHANGE_EVENT = "pagwave:profile-change";

const subscribers = new Set<() => void>();

export type Profile = {
  name: string;
  email: string;
  /** Data URL of the uploaded photo, or `null` to keep the default avatar. */
  avatar: string | null;
};

/** The defaults from `src/data/user-profile.ts`, overridable at runtime. */
export const defaultProfile: Profile = {
  name: userProfile.name,
  email: userProfile.email,
  avatar: null,
};

function subscribe(listener: () => void) {
  subscribers.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);

  return () => {
    subscribers.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

/* `useSyncExternalStore` requires a referentially stable snapshot, so the parsed
   object is memoised against the raw string kept in localStorage. */
let snapshotRaw: string | null | undefined;
let snapshotValue: Profile | null = null;

function getSnapshot(): Profile | null {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw === snapshotRaw && (snapshotValue !== null || raw === null)) {
    return snapshotValue;
  }

  snapshotRaw = raw;
  snapshotValue = null;

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        const name = typeof record.name === "string" ? record.name : defaultProfile.name;
        const email = typeof record.email === "string" ? record.email : defaultProfile.email;
        const avatar = typeof record.avatar === "string" ? record.avatar : null;

        snapshotValue = { name, email, avatar };
      }
    } catch {
      snapshotValue = null;
    }
  }

  return snapshotValue;
}

function readStoredProfile(): Partial<Profile> {
  const snapshot = getSnapshot();
  return snapshot ?? {};
}

/** Profile with the user's edits applied over the defaults. */
export function useProfile(): Profile {
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null);

  return {
    name: stored?.name ?? defaultProfile.name,
    email: stored?.email ?? defaultProfile.email,
    avatar: stored?.avatar ?? null,
  };
}

/** Partial update: only the sent fields change, the rest keep their value. */
export function saveProfile(patch: Partial<Profile>) {
  const next: Profile = {
    ...defaultProfile,
    ...readStoredProfile(),
    ...patch,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — keep the session consistent anyway.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
  subscribers.forEach((listener) => listener());
}