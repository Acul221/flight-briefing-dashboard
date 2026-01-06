// src/components/RACDelayPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import RACSummaryBar from "@/components/rac/RACSummaryBar";
import { addMinutesHHMM, diffMinutes } from "@/lib/timeMath";
import ToolTipInfo from "@/components/ui/ToolTipInfo";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { Card, CardContent } from "@/components/ui/card";
import { useRAC } from "@/context/RACContext";

const safeMinutes = (v) => (typeof v === "number" ? v : Number(v) || 0);

const getColorClass = (deviation, thr) => {
  if (deviation == null || Number.isNaN(deviation)) return "text-gray-500 dark:text-gray-400";
  const abs = Math.abs(Number(deviation));
  if (abs <= (thr?.green ?? 2)) return "text-green-500 font-semibold";
  if (abs <= (thr?.yellow ?? 5)) return "text-yellow-500 font-semibold";
  return "text-red-500 font-semibold";
};

export default function RACDelayPage() {
  // useRAC might be mocked in tests — provide safe defaults
  const racCtx = useRAC?.() ?? {};
  const {
    racData = {},
    setRacData = () => {},
    settings = {},
    checkpoints = [],
  } = racCtx;

  const { thresholds = { green: 2, yellow: 5 } } = settings || {};

  const { etd = "", blockOnATA = "", actualTimes = {}, manualTargets = {} } = racData || {};

  const setEtd = (v) => setRacData((p = {}) => ({ ...p, etd: v }));
  const setBlockOnATA = (v) => setRacData((p = {}) => ({ ...p, blockOnATA: v }));
  const setActualTimes = (obj) => setRacData((p = {}) => ({ ...p, actualTimes: { ...(p.actualTimes || {}), ...obj } }));
  const setManualTargets = (obj) => setRacData((p = {}) => ({ ...p, manualTargets: { ...(p.manualTargets || {}), ...obj } }));
  const setResult = (v) => setRacData((p = {}) => ({ ...p, result: v }));

  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // local debounce timer
  const timer = useRef(null);

  const getTargetETD = (off) => (!etd || off == null ? "" : addMinutesHHMM(etd, safeMinutes(off)));
  const getTargetBO = (off) => (!blockOnATA || off == null ? "" : addMinutesHHMM(blockOnATA, safeMinutes(off)));

  // Load possible snapshot from localStorage (tests: may be stubbed)
  useEffect(() => {
    try {
      const ETD = localStorage.getItem?.("RAC_ETD");
      const BO = localStorage.getItem?.("RAC_BO");
      const PB = localStorage.getItem?.("RAC_PB");
      if (ETD) setEtd(ETD);
      if (BO) setBlockOnATA(BO);
      if (PB) setActualTimes({ pb: PB });
      if (ETD || BO || PB) setSnapshotLoaded(true);
      try {
        localStorage.removeItem?.("RAC_ETD");
        localStorage.removeItem?.("RAC_BO");
        localStorage.removeItem?.("RAC_PB");
      } catch (e) {
        // noop cleanup
      }
    } catch (e) {
      // ignore in test env
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calc remote request (debounced) when relevant inputs change
  useEffect(() => {
    // only when we have the base times
    if (!etd && !blockOnATA) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const payload = {
          timestamps: {
            etd: etd || null,
            bo: blockOnATA || null,
            ...(actualTimes || {}),
            ...(manualTargets || {}),
          },
        };

        const res = await fetch("/.netlify/functions/rac-delay-calc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("RAC calc error:", err);
        setErrMsg("Calculation failed — check network or function.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [etd, blockOnATA, actualTimes, manualTargets, checkpoints]);

  const summaryItems = useMemo(() => {
    const cps = Array.isArray(checkpoints) ? checkpoints : [];
    return cps
      .filter((c) => c && c.id && c.id !== "bo")
      .map((c) => {
        const id = c.id;
        const actual = (actualTimes || {})[id] || "";
        const targetBO = (manualTargets || {})[id] || getTargetBO(c.offsetFromBO);
        const deviation = Number.isNaN(Number(diffMinutes(actual, targetBO))) ? null : diffMinutes(actual, targetBO);
        return { code: c.code || id, deviation };
      });
  }, [checkpoints, actualTimes, manualTargets, blockOnATA]);

  return (
    <div className="rac-scope p-4 max-w-3xl mx-auto grid gap-6">
      <h1 className="text-2xl font-bold text-center">Ramp Activity Deviation</h1>

      {snapshotLoaded && (
        <div className="text-center text-sm text-blue-600 dark:text-blue-400">📥 Snapshot data loaded</div>
      )}

      <RACSummaryBar items={summaryItems} thresholds={thresholds} />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <label>Estimated Time of Departure (ETD) <ToolTipInfo text="Planned ETD used to compute targets" /></label>
            <TimePicker disableClock clearIcon={null} format="HH:mm" value={etd || ""} onChange={setEtd} />
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <label>Block On (ATA) <ToolTipInfo text="Actual block on used to compute targets" /></label>
            <TimePicker disableClock clearIcon={null} format="HH:mm" value={blockOnATA || ""} onChange={setBlockOnATA} />
          </div>

          {(Array.isArray(checkpoints) ? checkpoints : []).filter(Boolean).map((cp) => {
            const id = cp.id;
            const actual = (actualTimes || {})[id] || "";
            const targetETD = getTargetETD(cp.offsetFromETD);
            const targetBO = (manualTargets && manualTargets[id]) || getTargetBO(cp.offsetFromBO);
            const devETD = diffMinutes(actual, targetETD);
            const devBO = diffMinutes(actual, targetBO);

            return (
              <div key={id} className="flex flex-col space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{cp.code ?? id} — {cp.label ?? "Checkpoint"}</div>
                  <ToolTipInfo text={`ETD offset: ${cp.offsetFromETD ?? "—"}m • BO offset: ${cp.offsetFromBO ?? "—"}m`} />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <div>
                    <div className="text-xs text-gray-500">Target (ETD)</div>
                    <div className="font-mono">{targetETD || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Target (BO)</div>
                    <div className="font-mono">{targetBO || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Actual</div>
                    <TimePicker disableClock clearIcon={null} format="HH:mm" value={actual || ""} onChange={(v) => setActualTimes({ [id]: v })} />
                  </div>
                </div>

                <div className="text-sm">
                  ETD deviation: <span className={getColorClass(devETD, thresholds)}>{isNaN(devETD) ? "—" : `${devETD}m`}</span>{" "}
                  • BO deviation: <span className={getColorClass(devBO, thresholds)}>{isNaN(devBO) ? "—" : `${devBO}m`}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {errMsg && <div className="text-center text-sm text-red-500">{errMsg}</div>}
      {loading && <div className="text-center text-sm text-gray-500">Calculating…</div>}
    </div>
  );
}
