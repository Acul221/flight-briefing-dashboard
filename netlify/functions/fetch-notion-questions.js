const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

exports.handler = async function (event, context) {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    const response = await notion.databases.query({
      database_id: databaseId
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
        tags: props.Tags?.rich_text?.[0]?.plain_text
          ?.split(",")
          ?.map((tag) => tag.trim()) || [],
        level: props.Level?.rich_text?.[0]?.plain_text || "",
        source: props.Source?.rich_text?.[0]?.plain_text || ""
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
