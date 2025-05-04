import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ToolTipInfo from "@/components/ui/ToolTipInfo";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { checkpoints } from "@/config/rac-offset-config";
import { useRAC } from "@/context/RACContext.jsx";

const getColorClass = (deviation) => {
  if (deviation === null || isNaN(deviation)) return "text-gray-500 dark:text-gray-400";
  if (Math.abs(deviation) <= 5) return "text-green-500 font-semibold";
  if (Math.abs(deviation) <= 15) return "text-yellow-500 font-semibold";
  return "text-red-500 font-semibold";
};

const addMinutes = (timeStr, offset) => {
  const [h, m] = timeStr.split(":" ).map(Number);
  const base = new Date();
  base.setHours(h);
  base.setMinutes(m + offset);
  return base.toTimeString().slice(0, 5);
};

const getTargetTimeFrom = (baseTime, offset) => {
  if (!baseTime) return "";
  return addMinutes(baseTime, offset);
};

const getDeviation = (actual, target) => {
  if (!actual || !target) return 0;
  const [ah, am] = actual.split(":" ).map(Number);
  const [th, tm] = target.split(":" ).map(Number);
  return (ah * 60 + am) - (th * 60 + tm);
};

export default function RACDelayPage() {
  const { racData, setRacData } = useRAC();
  const { etd, blockOnATA, actualTimes, manualTargets, result } = racData;
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);

  const setEtd = (val) => setRacData(prev => ({ ...prev, etd: val }));
  const setBlockOnATA = (val) => setRacData(prev => ({ ...prev, blockOnATA: val }));
  const setActualTimes = (val) => setRacData(prev => ({ ...prev, actualTimes: { ...prev.actualTimes, ...val } }));
  const setManualTargets = (val) => setRacData(prev => ({ ...prev, manualTargets: { ...prev.manualTargets, ...val } }));
  const setResult = (val) => setRacData(prev => ({ ...prev, result: val }));

  const handleChange = (id, value) => {
    setActualTimes({ [id]: value });
  };

  const handleTargetChange = (id, value) => {
    setManualTargets({ [id]: value });
  };

  const getTargetTime = (id, offset) => {
    if (manualTargets[id]) return manualTargets[id];
    if (!blockOnATA) return "";
    return addMinutes(blockOnATA, offset);
  };

  useEffect(() => {
    const storedETD = localStorage.getItem("RAC_ETD");
    const storedBO = localStorage.getItem("RAC_BO");
    const storedPB = localStorage.getItem("RAC_PB");

    if (storedETD) setEtd(storedETD);
    if (storedBO) setBlockOnATA(storedBO);
    if (storedPB) setActualTimes({ pb: storedPB });

    if (storedETD || storedBO || storedPB) setSnapshotLoaded(true);

    localStorage.removeItem("RAC_ETD");
    localStorage.removeItem("RAC_BO");
    localStorage.removeItem("RAC_PB");
  }, []);

  useEffect(() => {
    if (!blockOnATA || !etd) return;

    const timestamps = {
      etd,
      bo: blockOnATA,
      ...actualTimes,
    };

    checkpoints.forEach(({ id }) => {
      if (manualTargets[id]) {
        timestamps[`${id}_target`] = manualTargets[id];
      }
    });

    const fetchDeviation = async () => {
      try {
        const res = await fetch("/.netlify/functions/rac-delay-calc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamps }),
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Auto-fetch error:", err);
      }
    };

    fetchDeviation();
  }, [etd, blockOnATA, actualTimes, manualTargets]);

  return (
    <div className="rac-scope p-4 max-w-3xl mx-auto grid gap-6">
      <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Ramp Activity Deviation
      </h1>

      {snapshotLoaded && (
        <div className="text-center text-sm text-blue-600 dark:text-blue-400">
          📥 Snapshot data loaded from dashboard
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <label htmlFor="etd" className="flex items-center text-gray-800 dark:text-white">
              Estimated Time of Departure (ETD)
              <ToolTipInfo text="Waktu keberangkatan yang direncanakan" />
            </label>
            <TimePicker
              disableClock
              clearIcon={null}
              format="HH:mm"
              value={etd}
              onChange={setEtd}
              className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <label htmlFor="bo" className="flex items-center text-gray-800 dark:text-white">
              Block On_ATA
              <ToolTipInfo text="Waktu acuan BO untuk kalkulasi target" />
            </label>
            <TimePicker
              disableClock
              clearIcon={null}
              format="HH:mm"
              value={blockOnATA}
              onChange={setBlockOnATA}
              className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          {checkpoints.filter(cp => cp.id !== "bo").map(({ id, label, code, offset }) => (
            <div key={id} className="flex flex-col space-y-1">
              <label htmlFor={id} className="flex items-center text-gray-800 dark:text-white">
                {code} – {label}
                <ToolTipInfo text={`Offset: BO ${offset >= 0 ? "+" : ""}${offset}m`} />
              </label>
              <TimePicker
                disableClock
                clearIcon={null}
                format="HH:mm"
                value={actualTimes[id] || getTargetTime(id, offset)}
                onChange={(val) => handleChange(id, val)}
                className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
              <div className="flex justify-between items-start text-sm mt-1">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Target (ETD): {getTargetTimeFrom(etd, offset)} (ETD {offset >= 0 ? "+" : ""}{offset}m)
                  </div>
                  <div className={getColorClass(getDeviation(actualTimes[id], getTargetTimeFrom(etd, offset)))}>
                    Deviation vs ETD: {getDeviation(actualTimes[id], getTargetTimeFrom(etd, offset))} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600 dark:text-gray-400">
                    Target (BO_ATA): {getTargetTime(id, offset)} (BO {offset >= 0 ? "+" : ""}{offset}m)
                  </div>
                  <div className={getColorClass(getDeviation(actualTimes[id], getTargetTime(id, offset)))}>
                    Deviation vs BO: {getDeviation(actualTimes[id], getTargetTime(id, offset))} min
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
