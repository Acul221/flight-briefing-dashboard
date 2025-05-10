export async function handler(event) {
  const { lat, lon } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!lat || !lon || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing latitude, longitude, or OpenWeatherMap API key",
      }),
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.main) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid response from OpenWeatherMap" }),
      };
    }

    const result = {
      temp: data.main.temp,
      pressure: data.main.pressure,
      clouds: data.weather?.[0]?.description || "unknown clouds",
      visibility: data.visibility,
      windSpeed: data.wind?.speed,
      windDeg: data.wind?.deg,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch current weather",
        details: err.message,
      }),
    };
  }
}
