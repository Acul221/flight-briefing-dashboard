const ENDPOINT = "/.netlify/functions/log-event"; // optional, kalau belum ada, akan fallback ke console

export async function logEvent(name, payload = {}) {
  const evt = {
    name,
    ts: Date.now(),
    ...payload,
  };

  try {
    // coba kirim ke Netlify function kalau ada
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evt),
    });
    if (!res.ok) throw new Error("failed");
  } catch {
    // fallback: console
    if (typeof window !== "undefined") {
      console.debug("[analytics]", evt);
    }
  }
}
