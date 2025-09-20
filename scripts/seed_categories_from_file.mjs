// node scripts/seed_categories_from_file.mjs
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

const CATEGORIES_FILE = path.resolve("src/constants/categories.js");
const FN_URL =
  process.env.FN_URL || "http://localhost:8888/.netlify/functions/categories";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // pakai access_token admin login lokal

const content = fs.readFileSync(CATEGORIES_FILE, "utf8");
const match = content.match(/export const CATEGORIES\s*=\s*(\[[\s\S]*\]);/);

if (!match) throw new Error("CATEGORIES array not found");

const arr = eval(match[1]); // karena file JS sederhana; pastikan aman di lokal

for (const item of arr) {
  const payload = {
    slug: (item.label || item.value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    label: item.label || item.value,
    requires_aircraft: !!item.requiresAircraft,
    pro_only: !!item.proOnly,
    parent_id: null,
  };

  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Seeded:", data.item?.label || data.error);
}
