import { useSyncExternalStore } from "react";

/** Empty subscription: tells React the client is hydrated without a setState effect. */
const subscribe = () => () => {};

/**
 * Hydration-safe "am I on the client?" flag. Server render returns `false`,
 * the first client render returns `false` too, then it flips to `true`.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}