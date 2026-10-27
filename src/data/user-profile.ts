/**
 * Defaults for the signed-in user: profile (name, e-mail, avatar) plus the
 * copy used in the topbar and by the `/api/dashboard/summary` contract.
 *
 * Replace with an auth session later — everything downstream already reads the
 * profile from `src/lib/profile-store.ts`, so nothing else has to change.
 */
export type UserProfile = {
  name: string;
  email: string;
  title: string;
  subtitle: string;
  avatar: {
    url: string;
    initials: string;
  };
  accountLabel: string;
};

export const userProfile: UserProfile = {
  name: "Adrian Braun",
  email: "adrian.braun@email.com",
  title: "Dashboard",
  subtitle: "Overview",
  avatar: {
    url: "https://i.pravatar.cc/150?img=68",
    initials: "AB",
  },
  accountLabel: "My account",
};