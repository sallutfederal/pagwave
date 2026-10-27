"use client";

import { Avatar } from "@/components/ui/avatar";
import { userProfile } from "@/data/user-profile";
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
  const { avatar } = useProfile();

  const data = avatar
    ? { url: avatar, initials: userProfile.avatar.initials }
    : userProfile.avatar;

  return (
    <Avatar
      data={data}
      name={userProfile.subtitle}
      size={size}
      className={className}
      priority={priority}
    />
  );
}