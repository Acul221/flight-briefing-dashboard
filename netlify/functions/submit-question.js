const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const databaseMap = {
  icao: process.env.NOTION_DB_ICAO,
  a320: process.env.NOTION_DB_A320,
  a330: process.env.NOTION_DB_A330,
  crm: process.env.NOTION_DB_CRM,
  weather: process.env.NOTION_DB_WEATHER
};

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const databaseId = databaseMap[body.category || "icao"];

    if (!databaseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid category or missing database ID" })
      };
    }

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
            ? body.tags.split(",").map((tag) => ({ name: tag.trim() }))
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
