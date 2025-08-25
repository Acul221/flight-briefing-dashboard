// src/lib/normalizeText.js
export function normalizeText(text) {
  return text
    // Kata kunci waktu/jam
    .replace(/BLOC[K1I]/g, "BLOCK")
    .replace(/BLK[-–—_ ]?0N/g, "BLK-ON")
    .replace(/BLK[-–—_ ]?ONN/g, "BLK-ON")
    .replace(/BL[- ]?OFF/g, "BL-OFF")

    // Landing
    .replace(/LDN6/g, "LDNG")
    .replace(/LDNGG/g, "LDNG")

    // Takeoff
    .replace(/T[1I]KOF/g, "TKOF")
    .replace(/T0F/g, "TOF")
    .replace(/TK0F/g, "TKOF")

    // Air Time
    .replace(/A1R/g, "AIR")
    .replace(/A1RTIME/g, "AIR TIME")
    .replace(/A1R ?T1ME/g, "AIR TIME")

    // Time general
    .replace(/T1ME/g, "TIME")
    .replace(/TIMF/g, "TIME")

    // Runway
    .replace(/R1WY/g, "RWY")
    .replace(/RNY/g, "RWY")

    // Std/Sta
    .replace(/ST0/g, "STD")
    .replace(/STA:?0/g, "STA:0")

    // Misc
    .replace(/OFFF/g, "OFF")
    .replace(/ONN/g, "ON")
    .replace(/S1D/g, "SID")
    .replace(/S0P/g, "SOP");
}
