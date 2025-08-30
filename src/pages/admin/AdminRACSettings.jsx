// src/pages/admin/AdminRACSettings.jsx
import { useMemo } from "react";
import { useRAC } from "@/context/RACContext";
import { defaultCheckpoints } from "@/config/rac-offset-config";

export default function AdminRACSettings() {
  const { settings, setSettings } = useRAC();
  const { thresholds, offsets } = settings;

  // daftar checkpoint (merge default + offsets agar selalu ada semua id)
  const rows = useMemo(
    () =>
      defaultCheckpoints.map((c) => ({
        ...c,
        ...(offsets?.[c.id] || {}),
      })),
    [offsets]
  );

  const updateThr = (key, val) =>
    setSettings((s) => ({
      ...s,
      thresholds: { ...s.thresholds, [key]: Number(val) },
    }));

  const updateOffset = (id, key, val) =>
    setSettings((s) => ({
      ...s,
      offsets: {
        ...s.offsets,
        [id]: {
          ...(s.offsets?.[id] || {}),
          [key]: val === "" ? null : Number(val),
        },
      },
    }));

  const resetDefault = () =>
    setSettings({
      thresholds: { green: 5, yellow: 15 },
      offsets: Object.fromEntries(
        defaultCheckpoints.map((c) => [
          c.id,
          { offsetFromETD: c.offsetFromETD, offsetFromBO: c.offsetFromBO },
        ])
      ),
    });

  const inputCls =
    "w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600";

  const boxCls =
    "p-3 rounded-lg border bg-white/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700";

  return (
    <div className="space-y-6">
      {/* Thresholds */}
      <section className={boxCls}>
        <h3 className="font-semibold mb-3">Deviation Thresholds (minutes)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            Green ≤
            <input
              type="number"
              className={`${inputCls} mt-1`}
              value={thresholds.green}
              onChange={(e) => updateThr("green", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Yellow ≤
            <input
              type="number"
              className={`${inputCls} mt-1`}
              value={thresholds.yellow}
              onChange={(e) => updateThr("yellow", e.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          &gt; Yellow &gt; {thresholds.green} dan ≤ {thresholds.yellow}.{" "}
          <span className="whitespace-nowrap">
            Merah jika &gt; {thresholds.yellow}.
          </span>
        </p>
      </section>

      {/* Offsets */}
      <section className={boxCls}>
        <h3 className="font-semibold mb-3">Offsets per Checkpoint</h3>

        <div className="hidden md:grid grid-cols-12 text-xs font-medium text-gray-500 mb-2">
          <div className="col-span-2">Code</div>
          <div className="col-span-5">Label</div>
          <div className="col-span-2 text-center">ETD (min)</div>
          <div className="col-span-2 text-center">BO (min)</div>
          <div className="col-span-1 text-right">Preset</div>
        </div>

        <div className="space-y-2">
          {rows.map((cp) => (
            <div
              key={cp.id}
              className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="md:col-span-2 font-mono text-sm">{cp.code}</div>
              <div className="md:col-span-5 text-sm">{cp.label}</div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  placeholder="null"
                  className={inputCls}
                  value={
                    offsets?.[cp.id]?.offsetFromETD ??
                    cp.offsetFromETD ??
                    ""
                  }
                  onChange={(e) =>
                    updateOffset(cp.id, "offsetFromETD", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  placeholder="null"
                  className={inputCls}
                  value={
                    offsets?.[cp.id]?.offsetFromBO ?? cp.offsetFromBO ?? ""
                  }
                  onChange={(e) =>
                    updateOffset(cp.id, "offsetFromBO", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-1 text-right">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border bg-gray-50 dark:bg-gray-800"
                  title="Reset ke default untuk baris ini"
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      offsets: {
                        ...s.offsets,
                        [cp.id]: {
                          offsetFromETD: cp.offsetFromETD,
                          offsetFromBO: cp.offsetFromBO,
                        },
                      },
                    }))
                  }
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={resetDefault}
            className="px-4 py-2 rounded-lg border bg-gray-100 dark:bg-gray-800"
          >
            Reset All to Default
          </button>
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Perubahan disimpan otomatis (context → localStorage) dan langsung
        dipakai oleh halaman RAC Delay.
      </p>
    </div>
  );
}
