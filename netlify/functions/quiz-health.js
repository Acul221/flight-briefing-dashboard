/* netlify/functions/quiz-health.js */
/* A tiny health endpoint documenting quiz-pull response shape and env readiness. */

exports.handler = async () => {
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE);
  const hasNotion = !!process.env.NOTION_TOKEN;
  const hasV3 = !!process.env.NOTION_DB_QUESTION;

  const itemSchema = {
    id: "number",
    legacy_id: "string|null",
    question: "string",
    image: "string|null",
    choices: "string[4]",
    choiceImages: "(string|null)[4]",
    correctIndex: "0..3",
    explanation: "string",
    explanations: "string[4]",
    difficulty: "'easy'|'medium'|'hard'|null",
    source: "string|null",
    aircraft: "string|null",
    tags: "string[]",
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      status: "ok",
      version: "v3",
      source: "supabase-mirror",
      endpoints: {
        pull: "/.netlify/functions/quiz-pull",
      },
      env: {
        hasSupabase,
        hasNotion,
        hasV3,
      },
      item_schema: itemSchema,
      note: "quiz-pull returns { items: item[], count, category_id, include_descendants }",
    }),
  };
};

