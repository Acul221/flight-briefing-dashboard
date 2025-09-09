import { useEffect } from "react";

export default function ImageLightbox({ src, alt = "Image", open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[92vw] rounded-lg shadow-2xl border"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="mt-3 px-3 py-1.5 rounded bg-white text-gray-900 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
