const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

const sources = [
  { name: 'Simple Flying', url: 'https://simpleflying.com/feed/' },
  { name: 'AVWeb', url: 'https://www.avweb.com/feed/' },
  { name: 'Airline Geeks', url: 'https://airlinegeeks.com/feed/' },
  { name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml' },
];

exports.handler = async () => {
  try {
    const allFeeds = await Promise.all(
      sources.map(async ({ name, url }) => {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FlightBriefingBot/1.0)',
            },
            timeout: 10000,
          });

          const parsed = parser.parse(response.data);

          const items = Array.isArray(parsed.rss?.channel?.item)
            ? parsed.rss.channel.item
            : parsed.rss?.channel?.item
            ? [parsed.rss.channel.item]
            : [];

            return items.slice(0, 2).map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                source: name,
              }));
              
        } catch (err) {
          console.error(`❌ Failed to fetch ${name} → ${url}`);
          console.error(err.message);
          return [];
        }
      })
    );

    const combined = allFeeds.flat();

    const sorted = combined
      .filter(item => item.title && item.link)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 3); // ⬅️ BATAS MAKSIMAL BERITA DI SINI

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600',
      },
      body: JSON.stringify(sorted),
    };
  } catch (err) {
    console.error('❌ General Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch news', detail: err.message }),
    };
  }
};
