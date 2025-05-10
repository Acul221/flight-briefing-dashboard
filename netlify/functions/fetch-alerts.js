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
      const res = await axios.get('https://rss.app/feeds/wwH1cOHOD2wH1Mqf.xml', {
        headers: { 'User-Agent': 'Mozilla/5.0 (FlightBriefingBot)' }
      });
      const parsed = parser.parse(res.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const bmkgAlerts = items.slice(0, 3).map((item) => ({
        type: 'BMKG',
        message: item.title,
        link: item.link,
      }));
      allAlerts.push(...bmkgAlerts);
    } catch (err) {
      console.error('❌ BMKG Fetch Failed:', err.message);
    }

    // 2. GIS
    try {
      const res = await axios.get('https://www.nhc.noaa.gov/gis-ep.xml');
      const parsed = parser.parse(res.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const alerts = items.slice(0, 1).map(item => ({
        type: 'GIS',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...alerts);
    } catch (err) {
      console.error('❌ GIS Fetch Failed:', err.message);
    }

    // 3. Outlook
    try {
      const res = await axios.get('https://www.nhc.noaa.gov/xml/TWOEP.xml');
      const parsed = parser.parse(res.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const alerts = items.slice(0, 1).map(item => ({
        type: 'Outlook',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...alerts);
    } catch (err) {
      console.error('❌ Outlook Fetch Failed:', err.message);
    }

    // 4. Summary
    try {
      const res = await axios.get('https://www.nhc.noaa.gov/xml/TWSEP.xml');
      const parsed = parser.parse(res.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const alerts = items.slice(0, 1).map(item => ({
        type: 'Summary',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...alerts);
    } catch (err) {
      console.error('❌ Summary Fetch Failed:', err.message);
    }

    // 5. Atlantic TC Wallet
    try {
      const res = await axios.get('https://www.nhc.noaa.gov/nhc_at4.xml');
      const parsed = parser.parse(res.data);
      const items = ensureArray(parsed?.rss?.channel?.item);
      const alerts = items.slice(0, 1).map(item => ({
        type: 'Atlantic',
        message: item.title,
        link: item.link || null,
      }));
      allAlerts.push(...alerts);
    } catch (err) {
      console.error('❌ Atlantic Fetch Failed:', err.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store', // prevent stale cache
        'Content-Type': 'application/json',
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
