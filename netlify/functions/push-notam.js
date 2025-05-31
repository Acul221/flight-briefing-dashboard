const { Client } = require("@notionhq/client");
const moment = require("moment");

const notion = new Client({ auth: process.env.NOTION_TOKEN_NOTAM });
const databaseId = process.env.NOTION_DATABASE_ID;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text) throw new Error("No text provided.");

    // Parser logic ...
    const notams = []; // parsed results
    let current = null;
    let currentCategory = "General";

    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

    lines.forEach((line) => {
      if (/^\[.*\]/.test(line)) {
        currentCategory = line.replace(/^\[|\]$/g, "").trim();
      } else if (/^C\d{4}\/\d{2}/.test(line)) {
        if (current) notams.push(current);
        current = {
          NOTAM: line.match(/^C\d{4}\/\d{2}/)[0],
          ICAO: "",
          "Valid From": "",
          "Valid To": "",
          Text: "",
          Category: currentCategory,
          Urgency: "Advisory",
        };
      } else if (/^A\)/.test(line)) {
        current.ICAO = line.split(")")[1].trim();
      } else if (/^B\)/.test(line)) {
        current["Valid From"] = moment(line.split(")")[1].trim(), "YYMMDDHHmm").toISOString();
      } else if (/^C\)/.test(line)) {
        current["Valid To"] = moment(line.split(")")[1].trim(), "YYMMDDHHmm").toISOString();
      } else if (/^E\)/.test(line)) {
        if (current) current.Text += line.substring(2).trim();
      } else {
        if (current) current.Text += " " + line;
      }
    });
    if (current) notams.push(current);

    // Push to Notion
    for (const n of notams) {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          ICAO: { select: { name: n.ICAO } },
          NOTAM: { title: [{ text: { content: n.NOTAM } }] },
          Text: { rich_text: [{ text: { content: n.Text } }] },
          Category: { select: { name: n.Category } },
          Urgency: {
            select: {
              name: n.Urgency.includes("Urgent")
                ? "Urgent"
                : n.Urgency.includes("Advisory")
                ? "Advisory"
                : "Other",
            },
          },
          "Valid From": { date: { start: n["Valid From"] } },
          "Valid To": { date: { start: n["Valid To"] } },
        },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Parsed and pushed ${notams.length} NOTAM(s).` }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Parsing failed", error: err.message }),
    };
  }
};
