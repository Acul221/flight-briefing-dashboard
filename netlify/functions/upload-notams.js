const { Client } = require("@notionhq/client");
const multipart = require("parse-multipart-data");
const { parse } = require("csv-parse/sync");

const notion = new Client({ auth: process.env.NOTION_TOKEN_NOTAM });
const databaseId = "1ffea2873126804a868ed70177d8d95a";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const boundary = multipart.getBoundary(event.headers["content-type"]);
    const parts = multipart.parse(Buffer.from(event.body, "base64"), boundary);
    const file = parts[0];

    let notams = [];

    if (file.filename.endsWith(".csv")) {
      const records = parse(file.data, {
        columns: true,
        skip_empty_lines: true,
      });
      notams = records;
    } else if (file.filename.endsWith(".json")) {
      notams = JSON.parse(file.data.toString());
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Unsupported file type." }),
      };
    }

    const icao = notams[0]?.ICAO;
    const existing = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "ICAO",
        select: { equals: icao },
      },
    });

    for (const page of existing.results) {
      await notion.pages.update({
        page_id: page.id,
        archived: true,
      });
    }

    for (const n of notams) {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          ICAO: { select: { name: n.ICAO } },
          NOTAM: { title: [{ text: { content: n.NOTAM } }] },
          Text: { rich_text: [{ text: { content: n.Text } }] },
          Category: { select: { name: n.Category } },
          Urgency: {
            rich_text: [
              {
                text: {
                  content: n.Urgency.includes("Urgent")
                    ? "Urgent"
                    : n.Urgency.includes("Advisory")
                    ? "Advisory"
                    : "Other",
                },
              },
            ],
          },
          "Valid From": { date: { start: n["Valid From"] } },
          "Valid To": { date: { start: n["Valid To"] } },
        },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Uploaded ${notams.length} NOTAM(s) for ${icao}`,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Upload failed", error: err.message }),
    };
  }
};
