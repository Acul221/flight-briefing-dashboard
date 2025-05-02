import { useEffect, useState } from 'react';

function BMKGWindTemp() {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          '/.netlify/functions/fetch-bmkg?url=https://inasiam.bmkg.go.id/api/windtemp_get/get_date_now'
        );
        const json = await res.json();
        setData(json?.data || []);
      } catch (err) {
        console.error(err);
        setError('⚠️ Failed to fetch BMKG WindTemp data.');
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">BMKG WindTemp</h3>
      {error && <p className="text-red-500">{error}</p>}
      {!error && data.length === 0 && <p className="text-gray-500 dark:text-gray-400">Loading or no data available...</p>}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
              <tr>
                <th className="px-4 py-2">Altitude</th>
                <th className="px-4 py-2">Wind Dir</th>
                <th className="px-4 py-2">Wind Spd</th>
                <th className="px-4 py-2">Temp</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {data.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{entry.altitude}</td>
                  <td className="px-4 py-2">{entry.wind_dir}</td>
                  <td className="px-4 py-2">{entry.wind_speed}</td>
                  <td className="px-4 py-2">{entry.temp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BMKGWindTemp;
