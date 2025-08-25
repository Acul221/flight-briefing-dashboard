// netlify/functions/submit-question.js
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER || process.env.NOTION_DATABASE_ID;

// ---------- helpers ----------
const isArray = Array.isArray;
const toText = (s) => [{ type: "text", text: { content: String(s || "").slice(0, 1999) } }];
const setTitle = (v) => ({ title: toText(v) });
const setRich = (v) => ({ rich_text: toText(v) });
const setNumber = (n) => ({ number: typeof n === "number" ? n : null });
const setSelect = (name) => ({ select: name ? { name: String(name) } : null });
const setMultiSelect = (arr) => ({
  multi_select: (isArray(arr) ? arr : [])
    .filter(Boolean)
    .map((name) => ({ name: String(name) })),
});
const validHttpUrl = (value) => {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
const setUrl = (v) => ({ url: validHttpUrl(v) ? v : null });

// ---------- main ----------
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!databaseId || !process.env.NOTION_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing NOTION credentials (NOTION_TOKEN/NOTION_DB_MASTER)" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Normalisasi input dari UI
    const tags = isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

    const aircraftMulti =
      typeof body.aircraft === "string"
        ? body.aircraft.split(",").map((s) => s.trim()).filter(Boolean)
        : isArray(body.aircraft)
        ? body.aircraft
        : [];

    // Ambil schema DB supaya hanya kirim property yang ada
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const propsDef = db.properties;
    const propExists = (name, type) => propsDef[name] && propsDef[name].type === type;

    // TITLE (pakai property title apapun namanya)
    const titleEntry = Object.entries(propsDef).find(([, def]) => def.type === "title");
    if (!titleEntry) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No 'title' property found in Notion database." }),
      };
    }
    const titleName = titleEntry[0];

    const properties = {};
    properties[titleName] = setTitle(body.id || "");

    // Question
    if (propExists("Question", "rich_text")) {
      properties["Question"] = setRich(body.question || "");
    }

    // Question Image (opsional URL)
    if (propExists("Question Image", "url")) {
      properties["Question Image"] = setUrl(body.questionImage || "");
    } else if (propExists("questionImage", "url")) {
      properties["questionImage"] = setUrl(body.questionImage || "");
    } else if (propExists("Image", "url")) {
      properties["Image"] = setUrl(body.questionImage || "");
    }

    // Choices A–D + Explanation + isCorrect
    const letters = ["A", "B", "C", "D"];
    letters.forEach((L, i) => {
      const choiceText = body.choices?.[i] || "";
      const expText = body.explanations?.[i] || "";
      const isCorrect = body.correctIndex === i;
      const imgUrl = body.choiceImages?.[i] || "";

      // Choice text
      if (propExists(`Choice ${L}`, "rich_text")) {
        properties[`Choice ${L}`] = setRich(choiceText);
      }
      // Explanation
      if (propExists(`Explanation ${L}`, "rich_text")) {
        properties[`Explanation ${L}`] = setRich(expText);
      } else if (propExists(`Exp ${L}`, "rich_text")) {
        properties[`Exp ${L}`] = setRich(expText);
      }
      // isCorrect checkbox (schema lama kamu)
      if (propExists(`isCorrect ${L}`, "checkbox")) {
        properties[`isCorrect ${L}`] = { checkbox: !!isCorrect };
      }
      // Choice Image URL (opsional)
      if (propExists(`Choice Image ${L}`, "url")) {
        properties[`Choice Image ${L}`] = setUrl(imgUrl);
      } else if (propExists(`Image ${L}`, "url")) {
        properties[`Image ${L}`] = setUrl(imgUrl);
      }
    });

    // Correct Index (kalau ada number property)
    if (propExists("Correct Index", "number")) {
      properties["Correct Index"] = setNumber(
        typeof body.correctIndex === "number" ? body.correctIndex : null
      );
    } else if (propExists("correctIndex", "number")) {
      properties["correctIndex"] = setNumber(
        typeof body.correctIndex === "number" ? body.correctIndex : null
      );
    }

    // Tags (multi_select)
    if (propExists("Tags", "multi_select")) {
      properties["Tags"] = setMultiSelect(tags);
    }

    // Aircraft (schema lama kamu: multi_select)
    if (propExists("Aircraft", "multi_select")) {
      properties["Aircraft"] = setMultiSelect(aircraftMulti);
    } else if (propExists("Aircraft", "select")) {
      // fallback kalau nanti diubah ke select
      properties["Aircraft"] = setSelect(aircraftMulti[0] || "");
    }

    // Level (select)
    if (propExists("Level", "select")) {
      properties["Level"] = setSelect(body.level || "Easy");
    }

    // Source (url -> prefer; fallback rich_text)
    if (propExists("Source", "url")) {
      properties["Source"] = setUrl(body.source || "");
    } else if (propExists("Source", "rich_text")) {
      properties["Source"] = setRich(body.source || "");
    }

    // Category (select)
    if (propExists("Category", "select")) {
      properties["Category"] = setSelect(body.category || "general");
    }

    // (opsional) simpan payload mentah jika ada property 'Raw JSON'
    if (propExists("Raw JSON", "rich_text")) {
      properties["Raw JSON"] = setRich(JSON.stringify(body).slice(0, 1900));
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, pageId: response.id }) };
  } catch (error) {
    console.error("Submit error:", error?.body || error?.message || error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Unknown error" }) };
  }
};
