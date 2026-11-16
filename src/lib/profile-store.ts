"use client";

import { useSyncExternalStore } from "react";

import { useSession } from "@/components/session-provider";

/**
 * Account identity (name, e-mail) comes from the signed-in session — the API is
 * the source of truth. The only thing kept on this device is the profile photo,
 * and it is stored per user so a second account on the same browser never
 * inherits the first one's picture.
 */

const CHANGE_EVENT = "pagwave:avatar-change";

export type Profile = {
  name: string;
  email: string;
  /** Data URL of the uploaded photo, or `null` to show the initials. */
  avatar: string | null;
};

const keyFor = (userId: string) => `pagwave:avatar:${userId}`;

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function readAvatar(userId: string): string | null {
  try {
    const raw = window.localStorage.getItem(keyFor(userId));

    // Only image data URLs are ever rendered; anything else in storage is ignored.
    return raw?.startsWith("data:image/") ? raw : null;
  } catch {
    return null;
  }
}

/** The signed-in user's identity plus their locally stored photo. */
export function useProfile(): Profile {
  const user = useSession();
  const avatar = useSyncExternalStore(
    subscribe,
    () => readAvatar(user.id),
    () => null,
  );

  return { name: user.name, email: user.email, avatar };
}

export function saveAvatar(userId: string, avatar: string | null) {
  try {
    if (avatar) window.localStorage.setItem(keyFor(userId), avatar);
    else window.localStorage.removeItem(keyFor(userId));
  } catch {
    // Storage full or blocked — the photo simply will not persist.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}
