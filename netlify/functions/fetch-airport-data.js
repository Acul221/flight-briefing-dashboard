// netlify/functions/fetch-airport-data.js

const fetchMetar = require("./fetch-metar");
const fetchTaf = require("./fetch-taf");
const fetchSigmet = require("./fetch-sigmet");

exports.handler = async (event) => {
  const icao = event.queryStringParameters.icao?.toUpperCase();
  if (!icao) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ICAO parameter" }),
    };
  }

  try {
    // Panggil ketiga handler secara paralel
    const [metarData, tafData, sigmetData] = await Promise.all([
      fetchMetar.handler({ queryStringParameters: { icao } }),
      fetchTaf.handler({ queryStringParameters: { icao } }),
      fetchSigmet.handler({ queryStringParameters: { icao } }),
    ]);

    // Pastikan semuanya sukses parse body
    const metar = metarData.statusCode === 200 ? JSON.parse(metarData.body) : null;
    const taf = tafData.statusCode === 200 ? JSON.parse(tafData.body) : null;
    const sigmet = sigmetData.statusCode === 200 ? JSON.parse(sigmetData.body) : null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        metar,
        taf,
        sigmet
      })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data", detail: err.message })
    };
  }
};
