import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNews from '@/hooks/useNews';
import { formatDate as utilsFormatDate } from '@/utils/date';

const NewsWidget = () => {
  const { articles, loading, refresh } = useNews();
  const [expanded, setExpanded] = useState(false);

  const alerts = detectAlertNews(articles);
  const visibleArticles = expanded ? articles : articles.slice(0, 2);

  return (
    <motion.div
      className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200 rounded-2xl px-5 py-4 shadow-md text-sm space-y-4 transition-all duration-300"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">📰 Aviation News</h2>
        <motion.button
          onClick={refresh}
          whileTap={{ scale: 0.95 }}
          className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 transition"
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </motion.button>
      </div>

      {/* Alert News */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            key="alert-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700 p-3 rounded-lg shadow-sm"
          >
            <h3 className="font-semibold text-sm mb-1">🚨 Alert News</h3>
            <ul className="space-y-1 text-sm text-left">
              {alerts.map((a, i) => (
                <motion.li
                  key={`alert-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {truncate(a.title, 80)}{' '}
                    <span className="italic text-xs text-gray-500">({a.source})</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Articles */}
      <motion.ul
        className="space-y-3"
        initial={false}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false}>
          {visibleArticles.map((article, index) => (
            <motion.li
              key={article.link}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open article: ${article.title}`}
                className="block font-medium text-sm md:text-base text-blue-600 dark:text-blue-400 hover:underline"
              >
                {getIcon(article.title)} {truncate(article.title, 72)}
              </a>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span>{utilsFormatDate(article.pubDate, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span>—</span>
                <span className="italic">{article.source}</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {/* Expand Button */}
      <motion.button
        onClick={() => setExpanded(prev => !prev)}
        whileTap={{ scale: 0.97 }}
        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {expanded ? 'Show Less ▲' : 'Show More ▼'}
      </motion.button>
    </motion.div>
  );
};

// Helpers
const ALERT_KEYWORDS = ['incident', 'crash', 'emergency', 'scrambled', 'runway', 'diverted', 'fire'];

const detectAlertNews = (articles) =>
  articles.filter(article =>
    ALERT_KEYWORDS.some(keyword =>
      article.title.toLowerCase().includes(keyword)
    )
  );

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const truncate = (text, maxLength) =>
  text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;

const getIcon = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('incident') || lower.includes('crash')) return '⚠️';
  if (lower.includes('airbus') || lower.includes('boeing')) return '🛫';
  if (lower.includes('faa') || lower.includes('easa') || lower.includes('rule')) return '📜';
  if (lower.includes('weather') || lower.includes('storm')) return '🌩️';
  return '✈️';
};

export default NewsWidget;
