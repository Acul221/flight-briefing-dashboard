import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCZIB from '@/hooks/useCZIB';

const CZIBWidget = () => {
  const { czibs, loading, lastUpdated, refresh } = useCZIB();
  const [expanded, setExpanded] = useState(false);

  const visibleCZIBs = expanded ? czibs : czibs.slice(0, 6);

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
            className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 transition"
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
                  className="border-b border-dashed border-red-300 dark:border-red-600 pb-2"
                >
                  <div className="flex flex-col gap-1">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </a>
                    <div className="text-xs italic">
                      Published: {new Date(item.pubDate).toLocaleDateString()}
                    </div>
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
