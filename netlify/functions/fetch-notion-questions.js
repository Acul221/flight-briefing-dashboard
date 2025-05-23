import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function handler(event) {
  try {
    const path = event.queryStringParameters?.aircraft?.toLowerCase() || "a320";

    const databaseMap = {
      a320: process.env.NOTION_DB_A320,
      a330: process.env.NOTION_DB_A330,
      b737: process.env.NOTION_DB_B737,
      weather: process.env.NOTION_DB_WEATHER,
      crm: process.env.NOTION_DB_CRM,
      icao: process.env.NOTION_DB_ICAO,
    };

    const databaseId = databaseMap[path];

    if (!databaseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid aircraft path or missing database ID." })
      };
    }

    const response = await notion.databases.query({ database_id: databaseId });

    const questions = response.results.map((page) => {
      const props = page.properties;

      const getRichText = (field) =>
        props[field]?.rich_text?.map((t) => t.plain_text).join(" ") || "";

      return {
        id: props.ID?.title?.map((t) => t.plain_text).join(" ") || "(No ID)",
        question: getRichText("Question") || "(No Question)",
        choices: ["A", "B", "C", "D"].map((letter) => ({
          text: getRichText(`Choice ${letter}`),
          isCorrect: props[`isCorrect ${letter}`]?.checkbox || false,
          explanation: getRichText(`Explanation ${letter}`)
        })),
        tags: props.Tags?.multi_select?.map((tag) => tag.name.trim()) || [],
        level: props.Level?.select?.name || "",
        source: getRichText("Source") || ""
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(questions, null, 2)
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
