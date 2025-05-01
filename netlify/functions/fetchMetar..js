// netlify/functions/fetchMetar.js

export async function handler(event) {
    const { icao } = event.queryStringParameters;
    const apiKey = process.env.AVWX_API_KEY;
  
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
  