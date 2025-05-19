// netlify/functions/fetch-notion-questions.js

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function handler() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    const response = await notion.databases.query({
      database_id: databaseId
    });

    const questions = response.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        question: props.Name?.title?.[0]?.plain_text || "(No question)"
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(questions, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
