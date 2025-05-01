// netlify/functions/fetch-metar.js
exports.handler = async function(event) {
  const icao = event.queryStringParameters.icao;
  const apiKey = process.env.AVWX_API_KEY;

  const response = await fetch(`https://avwx.rest/api/metar/${icao}`, {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
