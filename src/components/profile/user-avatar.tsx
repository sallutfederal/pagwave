"use client";

import { useSession } from "@/components/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { useProfile } from "@/lib/profile-store";

/**
 * The signed-in user's avatar, swapped for the uploaded photo as soon as it is
 * saved — in the topbar, the settings form and anywhere else it is rendered.
 */
export function UserAvatar({
  size = "sm",
  className,
  priority = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}) {
  const user = useSession();
  const { avatar } = useProfile();

  // No photo uploaded: the Avatar renders the user's initials.
  const data = { url: avatar ?? "", initials: user.initials };

  return <Avatar data={data} name={user.name} size={size} className={className} priority={priority} />;
}
