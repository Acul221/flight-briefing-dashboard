// src/pages/admin/AdminPromos.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/utils/date";

/**
 * Struktur tabel yang diasumsikan:
 * promos (
 *   id uuid pk,
 *   code text unique not null,
 *   type text check in ('fixed','percent') not null,
 *   value numeric not null,     -- jika percent: 0..100
 *   start_date date not null,
 *   end_date date not null,
 *   created_at timestamptz default now()
 * )
 *
 * Catatan RLS (Supabase SQL):
 *  alter table promos enable row level security;
 *  create policy "admin read promos" on promos for select to authenticated
 *    using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
 *  create policy "admin write promos" on promos for all to authenticated
 *    using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
 *    with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
 */

const TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percent", label: "Percent (%)" },
];

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // form state
  const [id, setId] = useState(null); // null = create, non-null = edit
  const [code, setCode] = useState("");
  const [type, setType] = useState("fixed");
  const [value, setValue] = useState("");
  const [start, setStart] = useState(""); // yyyy-mm-dd
  const [end, setEnd] = useState(""); // yyyy-mm-dd

  const isEditing = useMemo(() => Boolean(id), [id]);

  useEffect(() => {
    loadPromos();
  }, []);

  async function loadPromos() {
    setFetching(true);
    setErrorMsg("");
    const { data, error } = await supabase
      .from("promos")
      .select("id, code, type, value, start_date, end_date, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load promos error:", error);
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        setErrorMsg(
          "Permission denied untuk tabel promos. Pastikan policy RLS admin sudah dibuat."
        );
      } else {
        setErrorMsg(error.message || "Gagal memuat data promo.");
      }
      setPromos([]);
    } else {
      setPromos(data || []);
    }
    setFetching(false);
  }

  function resetForm() {
    setId(null);
    setCode("");
    setType("fixed");
    setValue("");
    setStart("");
    setEnd("");
    setErrorMsg("");
  }

  function validateForm() {
    if (!code.trim()) return "Kode promo wajib diisi.";
    if (!value || isNaN(Number(value))) return "Value wajib angka.";
    if (!start) return "Start Date wajib diisi.";
    if (!end) return "End Date wajib diisi.";

    const startD = new Date(start);
    const endD = new Date(end);
    if (startD > endD) return "Start Date tidak boleh setelah End Date.";

    if (type === "percent") {
      const v = Number(value);
      if (v <= 0 || v > 100) return "Percent harus 1–100.";
    } else {
      if (Number(value) <= 0) return "Fixed amount harus > 0.";
    }
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validateForm();
    if (msg) {
      setErrorMsg(msg);
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      start_date: start,
      end_date: end,
    };

    let res;
    if (isEditing) {
      res = await supabase.from("promos").update(payload).eq("id", id).select().single();
    } else {
      res = await supabase.from("promos").insert(payload).select().single();
    }

    const { data, error } = res;

    setSaving(false);

    if (error) {
      console.error("Save promo error:", error);
      setErrorMsg(error.message || "Gagal menyimpan promo.");
      return;
    }

    // refresh list
    await loadPromos();
    resetForm();
  }

  function beginEdit(p) {
    setId(p.id);
    setCode(p.code);
    setType(p.type);
    setValue(String(p.value));
    setStart(p.start_date ? toInputDate(p.start_date) : "");
    setEnd(p.end_date ? toInputDate(p.end_date) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(p) {
    if (!confirm(`Hapus promo ${p.code}?`)) return;
    const { error } = await supabase.from("promos").delete().eq("id", p.id);
    if (error) {
      console.error("Delete promo error:", error);
      alert(error.message || "Gagal menghapus promo.");
      return;
    }
    await loadPromos();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Kelola Promo Codes</h1>
      <p className="text-sm text-gray-600">
        Tambah, edit, atau hapus kode promo. Pastikan tanggal mulai & berakhir jelas.
      </p>

      {/* FORM */}
      <form
        onSubmit={onSubmit}
        className="border rounded-xl p-4 space-y-4 bg-white dark:bg-zinc-900"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Kode Promo</label>
            <input
              type="text"
              className="border rounded px-3 py-2 uppercase"
              placeholder="Misal: SKY10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Gunakan huruf/angka tanpa spasi. Akan disimpan sebagai UPPERCASE.
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Tipe Diskon</label>
            <select
              className="border rounded px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Fixed Amount = potong rupiah; Percent = potong persentase.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">
              {type === "percent" ? "Nilai (%)" : "Nilai (Rp)"}
            </label>
            <input
              type="number"
              min={type === "percent" ? 1 : 1}
              max={type === "percent" ? 100 : undefined}
              className="border rounded px-3 py-2"
              placeholder={type === "percent" ? "cth: 10" : "cth: 10000"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              {type === "percent"
                ? "Persentase 1–100."
                : "Nominal dalam rupiah (tanpa titik)."}
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Start Date"
            />
            <p className="text-xs text-gray-500">Tanggal mulai promo (00:00 local).</p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              aria-label="End Date"
            />
            <p className="text-xs text-gray-500">Tanggal berakhir promo (23:59 local).</p>
          </div>
        </div>

        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEditing ? "Update Promo" : "Save Promo"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 rounded hover:bg-gray-300"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* LIST */}
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-3 text-sm font-medium bg-gray-50 dark:bg-zinc-800">
          Daftar Promo
        </div>

        {fetching ? (
          <div className="p-4 text-sm">Loading promos…</div>
        ) : promos.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Belum ada promo.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-zinc-900">
                <tr>
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-left p-2">Start</th>
                  <th className="text-left p-2">End</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 font-mono">{p.code}</td>
                    <td className="p-2 capitalize">{p.type}</td>
                    <td className="p-2 text-right">
                      {p.type === "percent"
                        ? `${Number(p.value)}%`
                        : `Rp ${formatIDR(Number(p.value))}`}
                    </td>
                    <td className="p-2">{toHumanDate(p.start_date)}</td>
                    <td className="p-2">{toHumanDate(p.end_date)}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => beginEdit(p)}
                        className="px-3 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* Helpers */
function toInputDate(d) {
  // Terima Date/ISO/string date → kembalikan yyyy-mm-dd
  try {
    const dt = new Date(d);
    // offset agar tidak bergeser zona waktu
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function toHumanDate(d) {
  try {
    return formatDate(d);
  } catch {
    return "-";
  }
}

function formatIDR(n) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("id-ID");
}
