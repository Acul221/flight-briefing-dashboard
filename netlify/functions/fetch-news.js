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
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=aviation+incident' },
];

exports.handler = async () => {
  try {
    const allFeeds = await Promise.all(
      sources.map(async ({ name, url }) => {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FlightBriefingBot/1.0)',
              Accept: 'application/rss+xml, application/xml',
            },
            timeout: 10000,
          });

          const parsed = parser.parse(response.data);
          let items = [];

          // RSS 2.0
          if (parsed.rss?.channel?.item) {
            items = Array.isArray(parsed.rss.channel.item)
              ? parsed.rss.channel.item
              : [parsed.rss.channel.item];

          // Atom (e.g. Google News)
          } else if (parsed.feed?.entry) {
            const raw = Array.isArray(parsed.feed.entry)
              ? parsed.feed.entry
              : [parsed.feed.entry];
            items = raw.map(entry => ({
              title: entry.title,
              link: entry.link?.href || entry.link,
              pubDate: entry.updated || entry.published || new Date().toISOString(),
            }));
          }

          const selected = items
            .filter(i => i.title && i.link)
            .slice(0, 2);

          console.log(`✔️ ${name}: ${selected.length} articles loaded`);
          return selected.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || new Date().toISOString(),
            source: name,
          }));
        } catch (err) {
          console.error(`❌ Failed to fetch ${name}:`, err.message);
          return [];
        }
      })
    );

    const combined = allFeeds.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 10);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
      },
      body: JSON.stringify(combined),
    };
  } catch (err) {
    console.error('❌ General Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch news', detail: err.message }),
    };
  }
};
