const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();

const ensureArray = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

exports.handler = async () => {
  try {
    const allAlerts = [];

    // 1. BMKG
    try {
      const bmkgRes = await axios.get('https://rss.app/feeds/wwH1cOHOD2wH1Mqf.xml');
      const parsed = parser.parse(bmkgRes.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const bmkgAlerts = items.slice(0, 3).map((item) => ({
        type: 'BMKG',
        message: item.title,
        link: item.link, // Bisa diarahkan langsung ke detail
      }));
      allAlerts.push(...bmkgAlerts);
    } catch (err) {
      console.error('❌ BMKG Fetch Failed:', err.message);
    }

    // 2. GIS (NOAA)
    try {
      const gisRes = await axios.get('https://www.nhc.noaa.gov/gis-ep.xml');
      const parsedGIS = parser.parse(gisRes.data);
      const gisItems = ensureArray(parsedGIS?.rss?.channel?.item);
      const gisAlerts = gisItems.slice(0, 1).map((item) => ({
        type: 'GIS',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...gisAlerts);
    } catch (err) {
      console.error('❌ GIS Fetch Failed:', err.message);
    }

    // 3. Outlook (NOAA)
    try {
      const outlookRes = await axios.get('https://www.nhc.noaa.gov/xml/TWOEP.xml');
      const parsedOutlook = parser.parse(outlookRes.data);
      const outlookItems = ensureArray(parsedOutlook?.rss?.channel?.item);
      const outlookAlerts = outlookItems.slice(0, 1).map((item) => ({
        type: 'Outlook',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...outlookAlerts);
    } catch (err) {
      console.error('❌ Outlook Fetch Failed:', err.message);
    }

    // 4. Summary (NOAA)
    try {
      const summaryRes = await axios.get('https://www.nhc.noaa.gov/xml/TWSEP.xml');
      const parsedSummary = parser.parse(summaryRes.data);
      const summaryItems = ensureArray(parsedSummary?.rss?.channel?.item);
      const summaryAlerts = summaryItems.slice(0, 1).map((item) => ({
        type: 'Summary',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...summaryAlerts);
    } catch (err) {
      console.error('❌ Summary Fetch Failed:', err.message);
    }

    // 5. Atlantic TC Wallet
    try {
      const atcRes = await axios.get('https://www.nhc.noaa.gov/nhc_at4.xml');
      const parsedATC = parser.parse(atcRes.data);
      const atcItems = ensureArray(parsedATC?.rss?.channel?.item);
      const atcAlerts = atcItems.slice(0, 1).map((item) => ({
        type: 'Atlantic',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...atcAlerts);
    } catch (err) {
      console.error('❌ Atlantic Fetch Failed:', err.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300',
      },
      body: JSON.stringify(allAlerts),
    };
  } catch (err) {
    console.error('❌ General Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch alerts', detail: err.message }),
    };
  }
};
