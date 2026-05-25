"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Icon, IconName } from "./icons";

type Props = {
  kind: "photo" | "proof";
  label: string;
  /** Legacy prop — ignored. The Plume design uses line icons, not emoji. */
  emoji?: string;
  icon?: IconName;
  variant?: "outline" | "cream" | "coral" | "primary";
  size?: "sm" | "md";
  onUploaded: (url: string, meta?: { sha256?: string }) => void;
  onError?: (message: string) => void;
  accept?: string;
  className?: string;
};

export function FileUploadButton({
  kind,
  label,
  icon,
  variant = "cream",
  size = "sm",
  onUploaded,
  onError,
  accept,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        sha256?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        const msg = data.error ?? "Upload failed.";
        setError(msg);
        onError?.(msg);
        return;
      }
      onUploaded(data.url, { sha256: data.sha256 });
    } catch {
      const msg = "Upload failed.";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  }

  const defaultAccept =
    kind === "photo"
      ? "image/png,image/jpeg,image/jpg,image/webp,image/gif"
      : "image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf";

  const resolvedIcon: IconName = icon ?? (kind === "photo" ? "image" : "upload");
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div className={className} style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        className={`plm-btn plm-btn-${size} plm-btn-${variant}`}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Icon name={resolvedIcon} size={iconSize} strokeWidth={1.8} />
        {uploading ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? defaultAccept}
        hidden
        onChange={handleChange}
      />
      {error ? (
        <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 500 }}>{error}</span>
      ) : null}
    </div>
  );
}
