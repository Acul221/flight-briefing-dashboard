export async function handler(event) {
  const icao = event.queryStringParameters.icao;
  const apiKey = process.env.AVWX_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing AVWX API Key in env" })
    };
  }

  if (!icao) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ICAO parameter" })
    };
  }

  try {
    const response = await fetch(`https://avwx.rest/api/notam/${icao}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch NOTAM: ${response.statusText}` })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: error.message }),
    };
  }
}
