"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useSession } from "@/components/session-provider";
import { saveAvatar, useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const OUTPUT_SIZE = 256;

/** Centre-crops whatever the user picked into a square JPEG data URL. */
async function toSquareDataUrl(file: File, size = OUTPUT_SIZE): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;

  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { id: userId } = useSession();
  const { avatar: savedAvatar } = useProfile();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = preview ?? savedAvatar;

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a PNG, JPEG, WebP or AVIF image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("The image must be smaller than 5 MB.");
      return;
    }

    try {
      const dataUrl = await toSquareDataUrl(file);
      setPreview(dataUrl);
      saveAvatar(userId, dataUrl);
    } catch {
      setError("We could not read that image. Try another file.");
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function removePhoto() {
    setPreview(null);
    saveAvatar(userId, null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card className="p-5">
      <h2 className="text-foreground text-[15px] font-semibold">Profile photo</h2>
      <p className="text-muted-foreground mt-1 mb-5 text-xs">
        Shown in the topbar, on statements and in shared reports. Square crops look best.
      </p>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Change profile photo"
          className={cn(
            "group relative grid size-28 shrink-0 place-items-center rounded-full ring-2 transition",
            dragging ? "ring-accent" : "ring-transparent hover:ring-accent/40",
          )}
        >
          <UserAvatar size="xl" className="size-28" />
          <span className="bg-rail/70 text-rail-fg absolute inset-0 grid place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5" />
          </span>
        </button>

        <div className="min-w-52 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload /> Upload photo
            </Button>
            {current ? (
              <Button variant="ghost" size="sm" onClick={removePhoto}>
                <Trash2 /> Remove
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground text-[11px]">
            PNG, JPEG, WebP or AVIF · up to 5 MB · resized to 256×256.
          </p>

          {error ? (
            <p role="alert" className="text-danger text-[11px]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}