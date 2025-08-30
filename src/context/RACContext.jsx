import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultCheckpoints } from "@/config/rac-offset-config";

const RACContext = createContext(null);
const LS_DATA = "RAC_DATA_V1";
const LS_SETTINGS = "RAC_SETTINGS_V1";

const defaultSettings = {
  thresholds: { green: 5, yellow: 15 },                   // menit
  offsets: Object.fromEntries(defaultCheckpoints.map(c => [c.id, {
    offsetFromETD: c.offsetFromETD, offsetFromBO: c.offsetFromBO
  }])),
};

export function RACProvider({ children }) {
  const [racData, setRacData] = useState(() =>
    JSON.parse(localStorage.getItem(LS_DATA) || "{}") || {}
  );
  const [settings, setSettings] = useState(() =>
    ({ ...defaultSettings, ...(JSON.parse(localStorage.getItem(LS_SETTINGS) || "{}")) })
  );

  useEffect(() => localStorage.setItem(LS_DATA, JSON.stringify(racData)), [racData]);
  useEffect(() => localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)), [settings]);

  // checkpoints hasil merge default + offset dari settings
  const checkpoints = useMemo(() => defaultCheckpoints.map(c => ({
    ...c, ...settings.offsets[c.id]
  })), [settings.offsets]);

  const value = { racData, setRacData, settings, setSettings, checkpoints };
  return <RACContext.Provider value={value}>{children}</RACContext.Provider>;
}

export const useRAC = () => useContext(RACContext);
