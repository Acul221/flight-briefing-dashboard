// src/hooks/useUserTier.js
import { useEffect, useState } from "react";

const STORAGE_KEY = "skydeckpro_tier";

function readTier() {
  if (typeof window === "undefined") return "free";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "free";
  } catch {
    return "free";
  }
}

export function useUserTier() {
  const [tier, setTierState] = useState(() => readTier());

  useEffect(() => {
    const current = readTier();
    if (current !== tier) setTierState(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTier = (next) => {
    const val = next || "free";
    setTierState(val);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, val);
      } catch {
        /* ignore */
      }
    }
  };

  const isPro = tier === "pro";
  return { tier, isPro, setTier };
}

export default useUserTier;
