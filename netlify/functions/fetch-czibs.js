const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

exports.handler = async () => {
  try {
    const response = await axios.get('https://www.easa.europa.eu/domains/air-operations/czibs/feed.xml');
    const xml = response.data;
    const parsed = parser.parse(xml);

    const rawItems = parsed?.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const simplified = items
      .map((item) => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
      }))
      .filter(i => i.title && i.link)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    console.log('✔️ Parsed', simplified.length, 'items');
    console.log('🧪 Sample:', simplified[0]);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json',
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
