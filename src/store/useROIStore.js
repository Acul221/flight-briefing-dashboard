// src/store/useROIStore.js
import { create } from "zustand";

export const useROIStore = create((set) => ({
  roiConfig: {},

  // ganti semua ROI sekaligus
  setROI: (newConfig) => set({ roiConfig: newConfig }),

  // update sebagian ROI (misalnya ubah x,y,w,h,angle,pad)
  updateROI: (key, newProps) =>
    set((state) => ({
      roiConfig: {
        ...state.roiConfig,
        [key]: { ...state.roiConfig[key], ...newProps },
      },
    })),
}));
