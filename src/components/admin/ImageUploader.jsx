import React, { useState } from "react";
import { uploadImage } from "@/utils/uploadImage";

export default function ImageUploader({ label = "Upload Image", value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const { publicUrl } = await uploadImage(file, { label });
      onChange?.(publicUrl);
    } catch (err) {
      console.error("Upload failed", err);
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm text-gray-600"
      />
      {uploading && <p className="text-xs text-gray-500">Uploading…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value ? (
        <div className="mt-2">
          <img src={value} alt="Preview" className="max-h-40 rounded border object-contain" />
          <div className="text-xs break-all mt-1">{value}</div>
        </div>
      ) : null}
    </div>
  );
}
