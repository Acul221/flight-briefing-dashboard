import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCZIB from '@/hooks/useCZIB';

const CZIBWidget = () => {
  const { czibs, loading, lastUpdated, refresh } = useCZIB();
  const [expanded, setExpanded] = useState(false);

  const visibleCZIBs = expanded ? czibs : czibs.slice(0, 5);

  // Fungsi untuk mengunduh PDF
  const handleDownloadPDF = async (czibLink) => {
    try {
      // Ambil link PDF dari halaman CZIB yang bersangkutan
      const pdfLink = czibLink.replace('czibs', 'czib-pdf') + '.pdf'; // Sesuaikan format URL PDF

      // Cek apakah link PDF valid
      const pdfResponse = await fetch(pdfLink);
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CZIB_${czibLink.split('/').pop()}.pdf`;  // Menggunakan ID CZIB untuk nama file
        a.click();
      } else {
        console.error('PDF not available for this CZIB');
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
    }
  };

  return (
    <div className="flex flex-col bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold text-red-700 dark:text-red-300">
          🚫 Conflict Zone Information Bulletins (CZIBs)
        </h2>
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
          <button
            onClick={refresh}
            className="px-2 py-1 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded text-xs font-semibold"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-600 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-2/3" />
        </div>
      ) : czibs.length === 0 ? (
        <p className="text-sm text-gray-400">No CZIBs available at the moment.</p>
      ) : (
        <>
          <ul className="space-y-2 text-sm text-red-800 dark:text-red-100">
            <AnimatePresence>
              {visibleCZIBs.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-dashed border-red-300 dark:border-red-600 pb-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs italic">
                      {item.country} — Valid until {item.valid_until_date}
                    </div>
                    {item.coordinates && (
                      <div className="text-xs italic text-gray-500 dark:text-gray-400">
                        Coordinates: {item.coordinates}
                      </div>
                    )}
                    <div
                      className={`text-xs font-medium ${item.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}
                    >
                      Status: {item.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDF(item.link)}
                      className="text-xs text-blue-600 hover:text-blue-400"
                    >
                      📥 Download PDF
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <button
            onClick={() => setExpanded(prev => !prev)}
            className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            {expanded ? 'Show Less ▲' : 'Show More ▼'}
          </button>
        </>
      )}
    </div>
  );
};

export default CZIBWidget;
