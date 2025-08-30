// netlify/functions/submit-question.js
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // ====== Build Notion Properties ======
    const properties = {
      // ID (Title)
      ID: {
        title: [
          {
            text: { content: body.id },
          },
        ],
      },

      // Question text
      Question: {
        rich_text: [
          {
            text: { content: body.question || "" },
          },
        ],
      },

      // Question Image (URL column in Notion)
      ...(body.questionImage
        ? {
            "Question Image URL": {
              url: body.questionImage,
            },
          }
        : {}),

      // Tags
      Tags: {
        multi_select: body.tags
          ? body.tags.map((tag) => ({ name: tag.trim() }))
          : [],
      },

      // Aircraft
      Aircraft: {
        multi_select: body.aircraft
          ? body.aircraft.split(",").map((ac) => ({ name: ac.trim() }))
          : [],
      },

      // Level
      Level: {
        select: { name: body.level || "Easy" },
      },

      // Source
      Source: {
        rich_text: [
          {
            text: { content: body.source || "" },
          },
        ],
      },

      // Category
      Category: {
        select: { name: body.category || "general" },
      },

      // Choices A–D
      ...["A", "B", "C", "D"].reduce((acc, letter, i) => {
        // Text of the choice
        acc[`Choice ${letter}`] = {
          rich_text: [
            {
              text: { content: body.choices?.[i] || "" },
            },
          ],
        };

        // Explanation
        acc[`Explanation ${letter}`] = {
          rich_text: [
            {
              text: { content: body.explanations?.[i] || "" },
            },
          ],
        };

        // Correct flag
        acc[`isCorrect ${letter}`] = {
          checkbox: body.correctIndex === i,
        };

        // Choice Image URL
        if (body.choiceImages?.[i]) {
          acc[`Choice Image ${letter} URL`] = {
            url: body.choiceImages[i],
          };
        }

        return acc;
      }, {}),
    };

    // ====== Push to Notion ======
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, pageId: response.id }),
    };
  } catch (error) {
    console.error("Submit error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        details: error,
      }),
    };
  }
};
