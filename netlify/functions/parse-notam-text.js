const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN_NOTAM });
const databaseId = process.env.NOTION_DATABASE_ID;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text, icao } = JSON.parse(event.body);
    if (!text || !icao) throw new Error("Missing text or ICAO.");

    // Clean up text: trim trailing spaces per line but keep \n
    const cleanedText = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");

    // Split long text into chunks of max 2000 characters for Notion API
    const textChunks = [];
    let index = 0;
    while (index < cleanedText.length) {
      textChunks.push(cleanedText.substring(index, index + 2000));
      index += 2000;
    }

    // Replace Old Data: archive existing entries with same ICAO
    const existing = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "ICAO",
        select: { equals: icao.toUpperCase() }
      }
    });

    for (const page of existing.results) {
      await notion.pages.update({
        page_id: page.id,
        archived: true
      });
    }

    // Push as a single block to Notion
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        ICAO: { select: { name: icao.toUpperCase() } },
        NOTAM: { title: [{ text: { content: "NOTAM Entry" } }] },
        Text: {
          rich_text: textChunks.map((chunk) => ({
            text: { content: chunk }
          }))
        },
        Category: { select: { name: "General" } },
        Urgency: { select: { name: "Advisory" } },
        "Valid From": { date: { start: new Date().toISOString() } },
        "Valid To": { date: { start: new Date().toISOString() } }
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "NOTAM uploaded successfully, old data replaced." })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Parsing failed", error: err.message })
    };
  }
};
