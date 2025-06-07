import fetch from "node-fetch";

export async function handler(event) {
  const { city } = event.queryStringParameters;
  const apiKey = "dc6ac8a994b2ed7125bd15ade1e7b29f";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: response.status, body: "Failed to fetch data" };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}
