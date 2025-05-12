// netlify/functions/fetch-czibs.js

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

exports.handler = async () => {
  try {
    const response = await axios.get('https://www.easa.europa.eu/domains/air-operations/czibs/feed.xml');
    const xml = response.data;
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];

    const data = Array.isArray(items) ? items : [items];

    const simplified = data.slice(0, 12).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json' // ✅ tambahkan ini
      },
      body: JSON.stringify(simplified),
    };
  } catch (error) {
    console.error('❌ Failed to fetch CZIBs:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch CZIBs' }),
    };
  }
};
