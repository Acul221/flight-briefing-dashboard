// netlify/functions/fetch-bmkg.js

export async function handler(event) {
  const { url } = event.queryStringParameters;

  // ✅ Whitelist BMKG subdomains
  const allowedHosts = ['inasiam.bmkg.go.id', 'rami.bmkg.go.id', 'aviation.bmkg.go.id'];

  try {
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing URL parameter' }),
      };
    }

    const parsedUrl = new URL(url);
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'URL not allowed. Hostname rejected.' }),
      };
    }

    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'text/plain';
    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch BMKG data',
        details: error.message,
      }),
    };
  }
}
