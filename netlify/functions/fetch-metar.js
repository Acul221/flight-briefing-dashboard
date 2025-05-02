// netlify/functions/fetch-metar.js
export async function handler(event) {
  const icao = event.queryStringParameters.icao;
  const apiKey = process.env.AVWX_API_KEY;

  console.log("ICAO:", icao);
  console.log("API Key exists:", !!apiKey);

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing AVWX API Key in env" })
    };
  }

  const response = await fetch(`https://avwx.rest/api/metar/${icao}`, {
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

