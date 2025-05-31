const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN_NOTAM });
const databaseId = process.env.NOTION_DATABASE_ID;

exports.handler = async function (event) {
  const icao = event.queryStringParameters.icao?.toUpperCase();

  if (!icao) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ICAO parameter" })
    };
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "ICAO",
        select: { equals: icao }
      },
      sorts: [
        {
          property: "Valid From",
          direction: "ascending"
        }
      ]
    });

    const results = response.results.map((page) => {
      const props = page.properties;
      return {
        NOTAM: props.NOTAM?.title[0]?.text?.content || "",
        "Valid From": props["Valid From"]?.date?.start || "",
        "Valid To": props["Valid To"]?.date?.start || "",
        Text: props.Text?.rich_text[0]?.text?.content || "",
        Category: props.Category?.select?.name || "",
        Urgency: props.Urgency?.select?.name || ""
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
