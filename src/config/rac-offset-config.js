/**
 * Ramp Activity Checkpoints Configuration
 * offset = jumlah menit dari waktu Block On (BO)
 */
export const checkpoints = [
  { id: "bo", label: "Block On_ATA", code: "BO", offset: 0 },
  { id: "ds", label: "Disembark Start", code: "DS", offset: 2 },
  { id: "df", label: "Disembark Finish", code: "DF", offset: 10 },
  { id: "cf", label: "Crew On Board Finish", code: "CF", offset: 11 },
  { id: "bs", label: "Boarding Start", code: "BS", offset: 14 },
  { id: "bf", label: "Boarding Finish", code: "BF", offset: 32 },
  { id: "dc", label: "Door Closed", code: "DC", offset: 34 },
  { id: "pb", label: "Pushback / ATD", code: "PB", offset: 35 },
];
