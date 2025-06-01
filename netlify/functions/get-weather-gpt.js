export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { narrative } = JSON.parse(event.body || '{}');
  const apiKey = process.env.GPT_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'GPT API key missing in environment',
        analysis: '🧠 [Placeholder] AI Reasoning is unavailable. Please activate billing on OpenAI to enable real-time analysis.',
      }),
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an aviation weather analyst assistant. Your task is to analyze the given weather summary, focusing on METAR, TAF, and Trend Forecast. 
            Provide a concise yet insightful explanation of weather phenomena that may affect flight operations, such as significant changes in visibility, wind shifts, thunderstorms, turbulence, or other hazards. 
            Include explanations of why such phenomena occur if applicable. Keep the explanation professional, clear, and under 150 words.`,
          },
          {
            role: 'user',
            content: narrative,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Failed to fetch GPT response',
          analysis: '⚠️ AI Reasoning unavailable (OpenAI API error)',
        }),
      };
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis: aiReply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Server error',
        details: err.message,
        analysis: '⚠️ AI Reasoning unavailable (server error)',
      }),
    };
  }
}
