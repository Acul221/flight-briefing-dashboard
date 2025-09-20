import { useEffect, useState } from "react";
import { Image as ImageIcon, UploadCloud, History, X } from "lucide-react";
import { uploadPublicImage, listRecentPublicUrls } from "@/lib/storageUpload";

export default function ImageInputPicker({ label, value, onChange, prefix }) {
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [recent, setRecent] = useState([]);
  const [compress, setCompress] = useState(true);

  useEffect(() => {
    if (!showPicker) return;
    let mounted = true;
    (async () => {
      try {
        const urls = await listRecentPublicUrls(prefix, 20);
        if (mounted) setRecent(urls);
      } catch (e) {
        console.error("list recent error", e);
      }
    })();
    return () => { mounted = false; };
  }, [showPicker, prefix]);

  return (
    <div className="space-y-2">
      {label && <label className="text-xs">{label}</label>}

      <div className="flex items-center gap-2">
        <ImageIcon size={18} className="opacity-60" />
        <input
          className="input input-bordered w-full"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />

        {/* Upload */}
        <label className="btn btn-ghost btn-sm" title="Upload file">
          {busy ? "..." : <><UploadCloud size={16} /> Upload</>}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setBusy(true);
                const url = await uploadPublicImage(f, prefix, { compress });
                onChange(url);
              } catch (err) {
                alert(err.message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>

        {/* Recent */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowPicker(true)}
          title="Recent uploads"
        >
          <History size={16} /> Recent
        </button>

        {/* Clear */}
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange("")} title="Clear">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Compress toggle */}
      <label className="label cursor-pointer justify-start gap-2 px-0">
        <input type="checkbox" className="toggle toggle-sm" checked={compress} onChange={() => setCompress(v => !v)} />
        <span className="label-text text-xs">Compress before upload</span>
      </label>

      {/* Preview */}
      {value?.trim() && (
        <img
          src={value}
          alt="preview"
          className="mt-1 rounded-md border max-h-40 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      {/* Picker modal */}
      {showPicker && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent uploads — {prefix}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPicker(false)}>
                <X size={16} />
              </button>
            </div>
            {!recent.length && <div className="text-sm opacity-60">No recent files found.</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recent.map((r) => (
                <button
                  key={r.url}
                  className="rounded-lg border hover:shadow p-2 text-left"
                  onClick={() => { onChange(r.url); setShowPicker(false); }}
                >
                  <img src={r.url} alt={r.name} className="rounded border max-h-28 w-full object-contain" />
                  <div className="mt-1 text-[11px] line-clamp-1">{r.name}</div>
                </button>
              ))}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowPicker(false)}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowPicker(false)} />
        </div>
      )}
    </div>
  );
}
