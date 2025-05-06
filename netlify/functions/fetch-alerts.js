const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();

exports.handler = async () => {
  try {
    // 1. Fetch SIGMET
    const sigmetRes = await axios.get('https://avwx.rest/api/sigmet', {
      headers: { Authorization: `Bearer ${process.env.AVWX_API_KEY}` },
      params: { format: 'json' },
    });
    console.log('✅ SIGMET Loaded:', sigmetRes.data); // Tambahkan ini
  
    const firFilter = ['WIII','WARR','WADD','WIMM','WAJJ','WALL','WAOO','WIOO','WAAA',
                       'WSSS','VTBS','RJTT','RKSI','OMDB','OERK','OEJN','YSSY','YMML'];

    const sigmet = sigmetRes.data.filter(item => firFilter.includes(item.station)).map(item => ({
      type: 'SIGMET',
      message: `${item.raw} (${item.station})`,
    }));

    // 2. Fetch RSS Volcanic Ash
    const vaacFeed = await axios.get('https://rss.app/feeds/JrfxXhX0xvK9ys2v.xml');
    const parsedVAAC = parser.parse(vaacFeed.data);
    const volcanoAlerts = parsedVAAC.rss.channel.item?.slice(0, 3).map(item => ({
      type: 'Volcano',
      message: item.title,
    })) || [];

    // 3. Fetch RSS TC
    const tcFeed = await axios.get('https://www.metoc.navy.mil/jtwc/rss/jtwc_warnings.xml');
    const parsedTC = parser.parse(tcFeed.data);
    const tcAlerts = parsedTC.rss.channel.item?.slice(0, 2).map(item => ({
      type: 'TC',
      message: item.title,
    })) || [];

    const allAlerts = [...sigmet, ...volcanoAlerts, ...tcAlerts].slice(0, 6);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300',
      },
      body: JSON.stringify(allAlerts),
    };
  } catch (err) {
    console.error('❌ General Error:', err); // << Tambah ini
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch alerts', detail: err.message }),
    };
  }
};
