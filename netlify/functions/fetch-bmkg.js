// netlify/functions/fetch-bmkg.js

export async function handler(event) {
  const { url } = event.queryStringParameters;

  // Hanya izinkan domain tertentu
  const allowedDomains = [
    "https://inasiam.bmkg.go.id",
    "https://rami.bmkg.go.id/api/windtemp_get/get_date_now"
  ];

  const isValid = allowedDomains.some(domain => url?.startsWith(domain));
  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL not allowed" }),
    };
  }

  try {
    const response = await fetch(url);
    const data = await response.text(); // Gunakan .json() kalau endpoint mengembalikan JSON

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Fetch failed", details: error.message }),
    };
  }
}
