import { useRAC } from "@/context/RACContext";
import { defaultCheckpoints } from "@/config/rac-offset-config";

export default function AdminRACSettings() {
  const { settings, setSettings } = useRAC();
  const { thresholds, offsets } = settings;

  const updateThr = (key, val) =>
    setSettings(s => ({ ...s, thresholds: { ...s.thresholds, [key]: Number(val) }}));

  const updateOffset = (id, key, val) =>
    setSettings(s => ({ ...s, offsets: { ...s.offsets, [id]: { ...s.offsets[id], [key]: val===""?null:Number(val) }}}));

  const resetDefault = () =>
    setSettings({ thresholds: { green:5, yellow:15 },
      offsets: Object.fromEntries(defaultCheckpoints.map(c => [c.id, {
        offsetFromETD:c.offsetFromETD, offsetFromBO:c.offsetFromBO
      }])),
    });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">RAC Admin Settings</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Deviation Thresholds (minutes)</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            Green ≤
            <input type="number" className="input" value={thresholds.green}
                   onChange={e=>updateThr("green", e.target.value)} />
          </label>
          <label className="flex items-center gap-2">
            Yellow ≤
            <input type="number" className="input" value={thresholds.yellow}
                   onChange={e=>updateThr("yellow", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Offsets per Checkpoint</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.keys(offsets).map(id => (
            <div key={id} className="p-3 rounded-lg border dark:border-gray-700">
              <div className="text-sm font-medium">{id.toUpperCase()}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-sm">
                  ETD (min)
                  <input type="number" placeholder="null"
                    className="input mt-1"
                    value={offsets[id].offsetFromETD ?? ""}
                    onChange={e=>updateOffset(id,"offsetFromETD", e.target.value)} />
                </label>
                <label className="text-sm">
                  BO (min)
                  <input type="number" className="input mt-1"
                    value={offsets[id].offsetFromBO ?? ""}
                    onChange={e=>updateOffset(id,"offsetFromBO", e.target.value)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button onClick={resetDefault} className="btn">Reset to Default</button>
      </div>
    </div>
  );
}

/* tailwind helpers (opsional, jika belum ada):
.input{ @apply w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600;}
.btn{ @apply px-4 py-2 rounded-lg border bg-gray-100 dark:bg-gray-800;}
*/
