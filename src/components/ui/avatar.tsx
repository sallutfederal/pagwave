"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Avatar as AvatarData } from "@/lib/schemas";

const sizeStyles = {
  xs: "size-8 text-[11px]",
  sm: "size-10 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-28 text-2xl",
} as const;

type AvatarProps = {
  data: AvatarData;
  name: string;
  size?: keyof typeof sizeStyles;
  className?: string;
  /** Above the fold (e.g. the topbar): skips lazy loading. */
  priority?: boolean;
};

/**
 * Photo avatar with a deterministic initials fallback, so a broken or offline
 * image never leaves a hole in the layout.
 */
export function Avatar({ data, name, size = "sm", className, priority = false }: AvatarProps) {
  // Tracked per `src`: a new photo must be able to load after an earlier failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === data.url;
  const isDataUrl = data.url.startsWith("data:");

  return (
    <span
      className={cn(
        "bg-accent-soft text-accent relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        sizeStyles[size],
        className,
      )}
    >
      {failed ? (
        <span aria-hidden>{data.initials}</span>
      ) : (
        <Image
          src={data.url}
          alt={name}
          fill
          sizes="112px"
          priority={priority}
          unoptimized={isDataUrl}
          className="object-cover"
          onError={() => setFailedSrc(data.url)}
        />
      )}
    </span>
  );
}