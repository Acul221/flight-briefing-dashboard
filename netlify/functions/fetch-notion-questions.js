const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER;

exports.handler = async function (event) {
  try {
    const params = new URLSearchParams(event.rawUrl.split("?")[1]);
    const category = params.get("aircraft") || "a320"; // default fallback

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Category",
        select: { equals: category }
      }
    });

    const questions = response.results.map((page) => {
      const props = page.properties;

      return {
        id: props.ID?.title?.[0]?.plain_text || "(No ID)",
        question: props.Question?.rich_text?.[0]?.plain_text || "(No Question)",
        choices: ["A", "B", "C", "D"].map((letter) => ({
          text: props[`Choice ${letter}`]?.rich_text?.[0]?.plain_text || "",
          isCorrect: props[`isCorrect ${letter}`]?.checkbox || false,
          explanation: props[`Explanation ${letter}`]?.rich_text?.[0]?.plain_text || ""
        })),
        tags: props.Tags?.multi_select?.map((tag) => tag.name) || [],
        level: props.Level?.select?.name || "",
        source: props.Source?.rich_text?.[0]?.plain_text || "",
        category: props.Category?.select?.name || ""
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
};
