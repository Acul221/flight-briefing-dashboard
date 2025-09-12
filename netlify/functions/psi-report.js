// netlify/functions/psi-report.js
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    const urlParam = event.queryStringParameters?.url || "https://www.skydeckpro.id";
    const strategy = event.queryStringParameters?.strategy || "mobile";

    const apiKey = process.env.PSI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing PSI_API_KEY" }),
      };
    }

    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      urlParam
    )}&key=${apiKey}&strategy=${strategy}`;

    const response = await fetch(psiUrl);
    if (!response.ok) {
      throw new Error(`PSI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const fieldMetrics = data.loadingExperience?.metrics || {};
    const audits = data.lighthouseResult?.audits || {};
    const performanceScore = data.lighthouseResult?.categories?.performance?.score || null;

    const lcp =
      fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile ||
      audits["largest-contentful-paint"]?.numericValue ||
      null;

    const inp =
      fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile ||
      audits.interactive?.numericValue ||
      null;

    const cls =
      fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ||
      audits["cumulative-layout-shift"]?.numericValue ||
      null;

    const result = {
      url: urlParam,
      strategy,
      lcp,
      inp,
      cls,
      performance_score: performanceScore,
    };

    // Simpan ke Supabase
    const { error } = await supabase.from("psi_reports").insert(result);
    if (error) {
      console.error("[psi-report] DB insert error:", error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        { ...result, timestamp: new Date().toISOString() },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("[psi-report] error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
