import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { useNavigate } from "react-router-dom";
import { useRAC } from "@/context/RACContext.jsx";

export default function RACSnapshotWidget() {
  const navigate = useNavigate();
  const { racData, setRacData } = useRAC();
  const { etd, blockOnATA, actualTimes } = racData;
  const pb = actualTimes.pb || "";

  const [deviation, setDeviation] = useState(null);

  useEffect(() => {
    if (etd && pb) {
      const [eh, em] = etd.split(":" ).map(Number);
      const [ph, pm] = pb.split(":" ).map(Number);
      const etdMins = eh * 60 + em;
      const pbMins = ph * 60 + pm;
      setDeviation(pbMins - etdMins);
    }
  }, [etd, pb]);

  const handleChange = (field, value) => {
    if (field === "etd") {
      setRacData(prev => ({ ...prev, etd: value }));
    } else if (field === "bo") {
      setRacData(prev => ({ ...prev, blockOnATA: value }));
    } else {
      setRacData(prev => ({
        ...prev,
        actualTimes: { ...prev.actualTimes, [field]: value },
      }));
    }
  };

  const getColorClass = (val) => {
    if (val === null || isNaN(val)) return "text-gray-500";
    if (Math.abs(val) <= 5) return "text-green-500 font-semibold";
    if (Math.abs(val) <= 15) return "text-yellow-500 font-semibold";
    return "text-red-500 font-semibold";
  };

  return (
    <Card className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-blue-100 dark:border-zinc-700 shadow-md">
      <CardContent className="p-5 space-y-5">

        {/* Snapshot Ringkas */}
        <div className="text-sm rounded-xl p-4 border border-white/10">
          <h3 className="font-bold mb-3 text-blue-600 dark:text-blue-300 text-base">✈️ RAC Snapshot</h3>
          <div className="flex justify-between text-sm font-mono">
            <div>
              <div className="text-xs text-gray-500">Planned ETD</div>
              <div>{etd || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">PB Actual</div>
              <div>{pb || "—"}</div>
            </div>
          </div>
          <div className={`mt-2 ${getColorClass(deviation)} text-sm`}>
            Deviation: {deviation > 0 ? "+" : ""}{deviation || 0} min
          </div>
        </div>

        {/* Form Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs mb-1 text-gray-500">Planned ETD</div>
            <TimePicker
              disableClock
              clearIcon={null}
              format="HH:mm"
              value={etd}
              onChange={(val) => handleChange("etd", val)}
              className="rounded border px-2 py-1 text-sm w-full"
            />
          </div>
          <div>
            <div className="text-xs mb-1 text-gray-500">Block On ATA</div>
            <TimePicker
              disableClock
              clearIcon={null}
              format="HH:mm"
              value={blockOnATA}
              onChange={(val) => handleChange("bo", val)}
              className="rounded border px-2 py-1 text-sm w-full"
            />
          </div>
          <div>
            <div className="text-xs mb-1 text-gray-500">Pushback Actual</div>
            <TimePicker
              disableClock
              clearIcon={null}
              format="HH:mm"
              value={pb}
              onChange={(val) => handleChange("pb", val)}
              className="rounded border px-2 py-1 text-sm w-full"
            />
          </div>
        </div>

        {/* Tombol Navigasi */}
        <button
          onClick={() => navigate("/rac-delay")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold transition"
        >
          🔍 See Detail
        </button>
      </CardContent>
    </Card>
  );
}
