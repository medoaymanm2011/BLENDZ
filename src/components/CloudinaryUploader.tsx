"use client";

import React, { useCallback, useState } from "react";

type Props = {
  onUploaded: (url: string) => void;
  folder?: string;
  buttonText?: string;
  className?: string;
  buttonClassName?: string;
};

export default function CloudinaryUploader({ onUploaded, folder, buttonText = "Upload Image", className = "", buttonClassName }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      // Get signed params from our API
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.NEXT_PUBLIC_ADMIN_TOKEN ? { "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify({ folder }),
      });
      const sign = await signRes.json();
      if (!signRes.ok || !sign?.ok) throw new Error(sign?.error || "Sign failed");

      const { cloudName, apiKey, timestamp, signature } = sign as {
        cloudName: string; apiKey: string; timestamp: number; signature: string; folder?: string;
      };

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      if (folder) form.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const upRes = await fetch(uploadUrl, { method: "POST", body: form });
      const up = await upRes.json();
      if (!upRes.ok || !up?.secure_url) throw new Error(up?.error?.message || "Upload failed");

      onUploaded(up.secure_url as string);
    } catch (err: any) {
      setError(err?.message || "Upload error");
    } finally {
      setBusy(false);
      try { (e.target as any).value = ""; } catch {}
    }
  }, [folder, onUploaded]);

  return (
    <div className={className}>
      <label className={`${buttonClassName ?? 'inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer'}`}>
        <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        <svg className={`w-4 h-4 ${busy ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>{busy ? 'Uploading...' : buttonText}</span>
      </label>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
