// netlify/functions/fetch-bmkg.js

export async function handler(event) {
    const { url } = event.queryStringParameters;
  
    if (!url || !url.startsWith('https://inasiam.bmkg.go.id')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid or missing BMKG URL' })
      };
    }
  
    try {
      const response = await fetch(url);
      const data = await response.text();
  
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: data
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch BMKG data', details: error.message })
      };
    }
  }
  