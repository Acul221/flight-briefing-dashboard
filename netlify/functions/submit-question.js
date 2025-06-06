const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        ID: {
          title: [
            {
              text: {
                content: body.id
              }
            }
          ]
        },
        Question: {
          rich_text: [
            {
              text: {
                content: body.question
              }
            }
          ]
        },
        Tags: {
          multi_select: body.tags
            ? body.tags.map((tag) => ({ name: tag.trim() }))
            : []
        },
        Aircraft: {
          multi_select: body.aircraft
            ? body.aircraft.split(",").map((ac) => ({ name: ac.trim() }))
            : []
        },
        Level: {
          select: { name: body.level || "Easy" }
        },
        Source: {
          rich_text: [
            {
              text: {
                content: body.source || ""
              }
            }
          ]
        },
        Category: {
          select: { name: body.category || "general" }
        },
        ...["A", "B", "C", "D"].reduce((acc, letter, i) => {
          acc[`Choice ${letter}`] = {
            rich_text: [
              {
                text: {
                  content: body.choices?.[i] || ""
                }
              }
            ]
          };
          acc[`Explanation ${letter}`] = {
            rich_text: [
              {
                text: {
                  content: body.explanations?.[i] || ""
                }
              }
            ]
          };
          acc[`isCorrect ${letter}`] = {
            checkbox: body.correctIndex === i
          };
          return acc;
        }, {})
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, pageId: response.id })
    };
  } catch (error) {
    console.error("Submit error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
