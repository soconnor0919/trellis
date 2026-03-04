"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset error state when the URL prop changes (e.g. after data loads from server)
  useEffect(() => { setImgError(false); }, [value]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setImgError(false);
      onChange(json.url!);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    void upload(file);
  };

  const hasValidImage = value && !imgError;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Drop zone — doubles as preview when image is set */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`group relative flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded border-2 border-dashed transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : hasValidImage
            ? "border-border bg-muted/20 hover:border-primary/50"
            : "border-border bg-muted/30 hover:border-primary/50"
        }`}
      >
        {uploading ? (
          /* Uploading spinner */
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 size={22} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </div>
        ) : hasValidImage ? (
          /* Image preview with hover overlay */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded"
              onError={() => setImgError(true)}
              className="max-h-40 max-w-full object-contain p-2"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Upload size={16} className="text-white" />
              <p className="text-xs font-medium text-white">Replace image</p>
            </div>
          </>
        ) : (
          /* Empty drop zone */
          <div className="flex flex-col items-center gap-2 py-4">
            <ImageIcon size={24} className="text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              Drag & drop or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WebP, GIF, SVG · max 5 MB</p>
          </div>
        )}
      </div>

      {/* URL input + clear/upload buttons */}
      <div className="flex gap-1.5">
        <input
          type="url"
          placeholder="Or paste image URL…"
          value={value}
          onChange={(e) => { setImgError(false); onChange(e.target.value); }}
          className="h-7 w-full rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setImgError(false); }}
            className="flex h-7 shrink-0 items-center gap-1 rounded border border-border bg-muted px-2 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <X size={11} />
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-7 shrink-0 items-center gap-1 rounded border border-border bg-muted px-2 text-xs hover:bg-muted/80 disabled:opacity-50"
        >
          <Upload size={11} />
          Upload
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
