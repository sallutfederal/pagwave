"use client";

import { useSyncExternalStore } from "react";

import type { BankCard } from "@/lib/schemas";

const STORAGE_KEY = "pagwave:user-cards";
const CHANGE_EVENT = "pagwave:user-cards-change";

const subscribers = new Set<() => void>();

/** Stable server snapshot: a fresh array on every call would loop forever. */
const EMPTY_CARDS: BankCard[] = [];

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

/* Like `profile-store`, the parsed array is memoised so the snapshot stays
   referentially stable between renders. */
let snapshotRaw: string | null | undefined;
let snapshotValue: BankCard[] | null = null;

function isBankCard(value: unknown): value is BankCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    (card.variant === "dark" || card.variant === "light") &&
    typeof card.balance === "number" &&
    (card.currency === "USD" || card.currency === "EUR" || card.currency === "TRY") &&
    typeof card.last4 === "string" &&
    typeof card.expiry === "string" &&
    (card.brand === "visa" || card.brand === "mastercard") &&
    typeof card.holder === "string"
  );
}

function getSnapshot(): BankCard[] {
  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw === snapshotRaw && (snapshotValue !== null || raw === null)) {
    return snapshotValue ?? [];
  }

  snapshotRaw = raw;
  snapshotValue = [];

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        snapshotValue = parsed.filter(isBankCard);
      }
    } catch {
      snapshotValue = [];
    }
  }

  return snapshotValue;
}

/** Cards created by the user, persisted on this device. */
export function useUserCards(): BankCard[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CARDS);
}

export function saveUserCards(cards: BankCard[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    return;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
  subscribers.forEach((listener) => listener());
}

export function addUserCard(card: BankCard) {
  saveUserCards([...getSnapshot(), card]);
}

export function removeUserCard(id: string) {
  saveUserCards(getSnapshot().filter((card) => card.id !== id));
}