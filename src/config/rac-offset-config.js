export const defaultCheckpoints = [
  { id:"bo", code:"BO", label:"Block On (ATA)",  offsetFromETD:null, offsetFromBO:0 },
  { id:"ds", code:"DS", label:"Disembark Start", offsetFromETD:-42,  offsetFromBO:2 },
  { id:"df", code:"DF", label:"Disembark Finish",offsetFromETD:-34,  offsetFromBO:10 },
  { id:"cf", code:"CF", label:"Crew Off Finish", offsetFromETD:-33,  offsetFromBO:11 },
  { id:"bs", code:"BS", label:"Boarding Start",  offsetFromETD:-30,  offsetFromBO:18 },
  { id:"bf", code:"BF", label:"Boarding Finish", offsetFromETD:-12,  offsetFromBO:30 },
  { id:"dc", code:"DC", label:"Door Closed",     offsetFromETD:-10,  offsetFromBO:32 },
  { id:"pb", code:"PB", label:"Pushback / ATD",  offsetFromETD:-9,   offsetFromBO:35 },
];
