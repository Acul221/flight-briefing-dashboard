// scripts/generate-sitemap.cjs
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.skydeckpro.id";

// Daftar route utama aplikasi React
const routes = [
  "/",             // Homepage
  "/dashboard",    // Dashboard
  "/pricing",      // Pricing page
  "/login",        // Login
  "/signup",       // Signup
  "/quiz",         // Quiz root
  "/terms",        // Terms of Service
  "/privacy",      // Privacy Policy
  "/refund"        // Refund Policy
];

// Tanggal terakhir build (hari ini)
const buildDate = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${route === "/" ? "daily" : "weekly"}</changefreq>
    <priority>${route === "/" ? "1.0" : "0.7"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), xml, "utf8");

console.log("✅ sitemap.xml generated!");
