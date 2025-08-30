// netlify/functions/submit-question.js
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const cleanUrl = (u) => (typeof u === "string" && u.trim() ? u.trim() : null);

    const properties = {
      ID: { title: [{ text: { content: body.id || "" } }] },
      Question: { rich_text: [{ text: { content: body.question || "" } }] },

      // Question image (URL) — only include if present
      ...(cleanUrl(body.questionImage)
        ? { "Question Image URL": { url: cleanUrl(body.questionImage) } }
        : {}),

      Tags: {
        multi_select: Array.isArray(body.tags)
          ? body.tags.map((t) => ({ name: String(t).trim() })).filter((t) => t.name)
          : [],
      },
      Aircraft: {
        multi_select: typeof body.aircraft === "string" && body.aircraft.trim()
          ? body.aircraft.split(",").map((ac) => ({ name: ac.trim() })).filter((t) => t.name)
          : [],
      },
      Level: { select: { name: body.level || "Easy" } },
      Source: { rich_text: [{ text: { content: body.source || "" } }] },
      Category: { select: { name: body.category || "general" } },

      ...["A", "B", "C", "D"].reduce((acc, letter, i) => {
        acc[`Choice ${letter}`] = {
          rich_text: [{ text: { content: (body.choices?.[i] || "").toString() } }],
        };
        acc[`Explanation ${letter}`] = {
          rich_text: [{ text: { content: (body.explanations?.[i] || "").toString() } }],
        };
        acc[`isCorrect ${letter}`] = { checkbox: body.correctIndex === i };

        const imgUrl = cleanUrl(body.choiceImages?.[i]);
        if (imgUrl) acc[`Choice Image ${letter} URL`] = { url: imgUrl };

        return acc;
      }, {}),
    };

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, pageId: response.id }) };
  } catch (error) {
    // Notion SDK often includes a detailed body; surface it for debugging
    const details =
      (error && error.body) ||
      (error && error.response) ||
      (error && error.data) ||
      error;

    console.error("Submit error:", error);
    console.error("Submit error details:", JSON.stringify(details, null, 2));

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Unknown error",
        details,
      }),
    };
  }
};
