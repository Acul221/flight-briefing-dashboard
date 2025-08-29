const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_MASTER;

exports.handler = async function (event) {
  try {
    const params = new URLSearchParams(event.rawUrl.split("?")[1]);
    const aircraft = params.get("aircraft") || "a320";
    const subject = params.get("subject")?.toLowerCase() || null;

    // Tentukan filter berdasarkan apakah ini soal umum (icao/crm/weather) atau aircraft
    const filter = ["icao", "crm", "weather", "airlaw", "human performance"].includes(
      aircraft.toLowerCase()
    )
      ? { property: "Category", select: { equals: aircraft } }
      : { property: "Aircraft", multi_select: { contains: aircraft } };

    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
    });

    const questions = response.results
      .map((page) => {
        const props = page.properties;

        return {
          id: props.ID?.title?.[0]?.plain_text || "(No ID)",
          question: props.Question?.rich_text?.[0]?.plain_text || "(No Question)",
          questionImage: props["Question Image"]?.url || "", // ✅ gambar soal

          choices: ["A", "B", "C", "D"].map((letter) => ({
            text: props[`Choice ${letter}`]?.rich_text?.[0]?.plain_text || "",
            isCorrect: props[`isCorrect ${letter}`]?.checkbox || false,
            explanation: props[`Explanation ${letter}`]?.rich_text?.[0]?.plain_text || "",
            image: props[`Choice Image ${letter}`]?.url || "", // ✅ gambar tiap pilihan
          })),

          tags: props.Tags?.multi_select?.map((tag) => tag.name.toLowerCase()) || [],
          level: props.Level?.select?.name || "",
          source:
            props.Source?.url ||
            props.Source?.rich_text?.[0]?.plain_text ||
            "",
          category: props.Category?.select?.name?.toLowerCase() || "",
        };
      })
      .filter((q) => {
        if (!subject || subject === "all") return true;
        return q.category === subject || q.tags.includes(subject);
      });

    return {
      statusCode: 200,
      body: JSON.stringify(questions, null, 2),
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
