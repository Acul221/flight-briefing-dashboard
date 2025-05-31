
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const NOTAMS = require('./notams_parsed.json'); // Simpan hasil parsing ke file ini

async function pushNotams() {
  const response = await fetch('http://localhost:8888/.netlify/functions/push-notam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      icao: 'WIII',
      notams: NOTAMS
    })
  });

  const result = await response.json();
  console.log("✅ Response from Netlify Function:", result);
}

pushNotams();
