"use client";
import { useRef, useState } from "react";
export function SupportAttachmentPicker({
  value,
  onChange,
  disabled = false,
  onBusyChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const names = useRef<Record<string, string>>({});
  return (
    <div style={{ fontSize: 12, padding: "12px 0" }}>
      <label>
        Product images / documents (JPG, PNG, WebP, PDF or TXT; up to 5 files, 4 MB each)
        <input
          aria-label="Add attachments"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
          disabled={disabled || uploading || value.length >= 5}
          onChange={async (e) => {
            const files = [...(e.target.files || [])];
            e.target.value = "";
            setError("");
            if (files.length + value.length > 5) {
              setError("Choose up to five attachments.");
              return;
            }
            setUploading(true);
            onBusyChange?.(true);
            const ids = [...value];
            try {
              for (const file of files) {
                if (file.size > 4 * 1024 * 1024)
                  throw new Error("Each attachment must be 4 MB or smaller.");
                const data = new FormData();
                data.append("file", file);
                const response = await fetch("/api/support/attachments", {
                  method: "POST",
                  body: data,
                  signal: AbortSignal.timeout(30000),
                });
                const json = await response.json();
                if (!response.ok)
                  throw new Error(json.error || "Upload failed.");
                ids.push(json.attachment.id);
                names.current[json.attachment.id] = json.attachment.name;
                onChange([...ids]);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed.");
            } finally {
              setUploading(false);
              onBusyChange?.(false);
            }
          }}
        />
      </label>
      {uploading && <p role="status">Uploading attachment…</p>}
      {error && <p role="alert">{error}</p>}
      {value.map((id, i) => (
        <div key={id} style={{ display: "flex", gap: 12, padding: 4 }}>
          <a
            href={"/api/support/attachments/" + encodeURIComponent(id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {names.current[id] || "Attachment " + (i + 1)}
          </a>
          <button
            type="button"
            disabled={disabled || uploading}
            aria-label={"Remove attachment " + (i + 1)}
            onClick={() => onChange(value.filter((v) => v !== id))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
