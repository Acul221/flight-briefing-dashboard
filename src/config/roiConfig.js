// ROI definitions for Flight Plan OCR
// Coordinates are relative (0–1) of image width/height
// Bisa di-tweak per airline/layout

const roiConfig = {
  header: { 
    label: "Header (Aircraft/Reg/Flight)", 
    x: 0.05, y: 0.23, w: 0.45, h: 0.06 
  },
  stdsta: { 
    label: "STD/STA", 
    x: 0.55, y: 0.23, w: 0.40, h: 0.06 
  },
  dep: { 
    label: "DEP line", 
    x: 0.05, y: 0.35, w: 0.90, h: 0.06 
  },
  arr: { 
    label: "ARR line", 
    x: 0.05, y: 0.42, w: 0.90, h: 0.06 
  },
  times: { 
    label: "Times (BLK/TKOF/LDG/AIR)", 
    x: 0.55, y: 0.35, w: 0.40, h: 0.12 
  },
};

export default roiConfig;
