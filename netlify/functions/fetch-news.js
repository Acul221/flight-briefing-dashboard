const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

const sources = [
  { name: 'Simple Flying', url: 'https://simpleflying.com/feed/' },
  { name: 'AVWeb', url: 'https://www.avweb.com/feed/' },
  { name: 'Airline Geeks', url: 'https://airlinegeeks.com/feed/' },
  { name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml' },
  { name: 'Aviation News Online', url: 'https://rss.app/feeds/KHzvVE0NJYFhrbpz.xml' },
  { name: 'AINonline', url: 'https://rss.app/feeds/FFDvmxCReyT4wdHu.xml' },
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

          const selected = items
            .filter(i => i.title && i.link)
            .slice(0, 2) // max 2 items per source

          console.log(`✔️ ${name}: ${selected.length} articles loaded`);

          return selected.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || new Date().toISOString(),
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
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 10); // Final limit for all sources combined

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
