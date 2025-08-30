import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ToolTipInfo from "@/components/ui/ToolTipInfo";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import { useRAC } from "@/context/RACContext";
import RACSummaryBar from "@/components/rac/RACSummaryBar";
import { addMinutesHHMM, diffMinutes } from "@/lib/timeMath";

const getColorClass = (deviation, thr) => {
  if (deviation == null) return "text-gray-500 dark:text-gray-400";
  const abs = Math.abs(deviation);
  if (abs <= thr.green) return "text-green-500 font-semibold";
  if (abs <= thr.yellow) return "text-yellow-500 font-semibold";
  return "text-red-500 font-semibold";
};

export default function RACDelayPage() {
  const { racData, setRacData, settings, checkpoints } = useRAC();
  const { thresholds } = settings;
  const { etd = "", blockOnATA = "", actualTimes = {}, manualTargets = {}, result } = racData;

  const setEtd = (v)=>setRacData(p=>({...p,etd:v}));
  const setBlockOnATA = (v)=>setRacData(p=>({...p,blockOnATA:v}));
  const setActualTimes = (obj)=>setRacData(p=>({...p, actualTimes:{...p.actualTimes, ...obj}}));
  const setManualTargets = (obj)=>setRacData(p=>({...p, manualTargets:{...p.manualTargets, ...obj}}));
  const setResult = (v)=>setRacData(p=>({...p, result:v}));

  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const getTargetETD = (id, off) => !etd || off==null ? "" : addMinutesHHMM(etd, off);
  const getTargetBO  = (id, off) => !blockOnATA || off==null ? "" : addMinutesHHMM(blockOnATA, off);

  const getTarget = (id, offBO) => manualTargets[id] ?? getTargetBO(id, offBO);

  // load snapshot sekali
  useEffect(() => {
    const ETD = localStorage.getItem("RAC_ETD");
    const BO  = localStorage.getItem("RAC_BO");
    const PB  = localStorage.getItem("RAC_PB");
    if (ETD) setEtd(ETD);
    if (BO)  setBlockOnATA(BO);
    if (PB)  setActualTimes({ pb: PB });
    if (ETD || BO || PB) setSnapshotLoaded(true);
    localStorage.removeItem("RAC_ETD"); localStorage.removeItem("RAC_BO"); localStorage.removeItem("RAC_PB");
  }, []);

  // debounce fetch
  const timer = useRef();
  useEffect(() => {
    if (!blockOnATA || !etd) return;
    const timestamps = { etd, bo: blockOnATA, ...actualTimes };
    checkpoints.forEach(({ id }) => { if (manualTargets[id]) timestamps[`${id}_target`] = manualTargets[id]; });
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true); setErrMsg("");
        const res = await fetch("/.netlify/functions/rac-delay-calc", {
          method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ timestamps })
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        console.error(e); setErrMsg("Perhitungan otomatis gagal. Coba lagi / cek koneksi.");
      } finally { setLoading(false); }
    }, 450);
    return () => clearTimeout(timer.current);
  }, [etd, blockOnATA, actualTimes, manualTargets, checkpoints]);

  // data untuk summary bar (deviasi vs BO)
  const summaryItems = useMemo(() => checkpoints
    .filter(cp => cp.id !== "bo")
    .map(cp => {
      const targetBO = getTargetBO(cp.id, cp.offsetFromBO);
      const deviation = diffMinutes(actualTimes[cp.id], targetBO);
      return { code: cp.code, deviation };
    }), [checkpoints, actualTimes, blockOnATA]);

  return (
    <div className="rac-scope p-4 max-w-3xl mx-auto grid gap-6">
      <h1 className="text-2xl font-bold text-center">Ramp Activity Deviation</h1>

      {snapshotLoaded && <div className="text-center text-sm text-blue-600 dark:text-blue-400">📥 Snapshot data loaded from dashboard</div>}

      <RACSummaryBar items={summaryItems} thresholds={thresholds} />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <label className="flex items-center">Estimated Time of Departure (ETD)<ToolTipInfo text="Waktu keberangkatan rencana"/></label>
            <TimePicker disableClock clearIcon={null} format="HH:mm" value={etd} onChange={setEtd} className="input"/>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <label className="flex items-center">Block On (ATA)<ToolTipInfo text="Acuan BO untuk kalkulasi target"/></label>
            <TimePicker disableClock clearIcon={null} format="HH:mm" value={blockOnATA} onChange={setBlockOnATA} className="input"/>
          </div>

          {checkpoints.filter(cp=>cp.id!=="bo").map(({ id, label, code, offsetFromETD, offsetFromBO }) => {
            const actual = actualTimes[id];
            const targetETD = getTargetETD(id, offsetFromETD);
            const targetBO  = getTarget(id, offsetFromBO);
            const devETD = diffMinutes(actual, targetETD);
            const devBO  = diffMinutes(actual, targetBO);
            return (
              <div key={id} className="flex flex-col space-y-1">
                <label className="flex items-center">{code} – {label}
                  <ToolTipInfo text={`ETD ${offsetFromETD ?? "—"}m • BO ${offsetFromBO ?? "—"}m`} />
                </label>
                <TimePicker disableClock clearIcon={null} format="HH:mm"
                  value={actual || targetBO} onChange={(val)=>setActualTimes({ [id]: val })}
                  className="input"/>
                <div className="flex justify-between items-start text-sm mt-1">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Target (ETD): {targetETD || "—"} {offsetFromETD!=null && `(ETD ${offsetFromETD>=0?"+":""}${offsetFromETD}m)`}</div>
                    <div className={getColorClass(devETD, thresholds)}>Deviation vs ETD: {devETD==null?"—":`${devETD} min`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 dark:text-gray-400">Target (BO_ATA): {targetBO || "—"} {offsetFromBO!=null && `(BO ${offsetFromBO>=0?"+":""}${offsetFromBO}m)`}</div>
                    <div className={getColorClass(devBO, thresholds)}>Deviation vs BO: {devBO==null?"—":`${devBO} min`}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && <div className="text-sm text-blue-600">⏳ Calculating…</div>}
          {errMsg && <div className="text-sm text-red-500">⚠ {errMsg}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
