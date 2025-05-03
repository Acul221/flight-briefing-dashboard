const { checkpoints } = require("../../src/config/rac-offset-config");

exports.handler = async (event) => {
  try {
    const { timestamps } = JSON.parse(event.body);

    const timeToMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const refBO = timestamps.bo;
    if (!refBO) throw new Error("Missing BO reference time");

    const refBOMin = timeToMinutes(refBO);
    const result = {};

    for (const [key, actualTime] of Object.entries(timestamps)) {
      if (key.endsWith("_target") || key === "etd") continue;

      const targetKey = `${key}_target`;
      let targetTime = timestamps[targetKey];

      if (!targetTime && key !== "bo") {
        const found = checkpoints.find((cp) => cp.id === key);
        if (found) {
          const offset = found.offset || 0;
          const calcMins = refBOMin + offset;
          targetTime = minutesToTime(calcMins);
        }
      }

      if (!targetTime) continue;

      const actualMins = timeToMinutes(actualTime);
      const plannedMins = timeToMinutes(targetTime);
      const deviation = actualMins - plannedMins;

      result[key] = {
        targetTime,
        actualTime,
        deviation,
      };
    }

    // ETD special handling
    if (timestamps.etd && timestamps.pb) {
      const etdMins = timeToMinutes(timestamps.etd);
      const pbMins = timeToMinutes(timestamps.pb);
      result.etdActual = timestamps.pb;
      result.etdDeviation = pbMins - etdMins;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("RAC Delay Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
