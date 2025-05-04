import useNews from '@/hooks/useNews';

const NewsWidget = () => {
  const { articles, loading } = useNews();

  const alerts = detectAlertNews(articles);

  // Batasi jumlah berita tampil (termasuk alert tetap ditampilkan semua)
  const visibleArticles = articles.slice(0, 6);

  return (
    <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:ring-2 hover:ring-blue-400 dark:hover:ring-yellow-400 text-center">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">📰 Aviation News</h2>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-600 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-2/3" />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-400">No news available at the moment.</p>
      ) : (
        <>
          {alerts.length > 0 && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700 p-3 rounded-lg mb-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-1">🚨 Alert News</h3>
              <ul className="space-y-1 text-sm">
                {alerts.map((a, i) => (
                  <li key={`alert-${i}`}>
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {truncate(a.title, 80)}{' '}
                      <span className="italic text-xs text-gray-500">({a.source})</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-3">
            {visibleArticles.map((article, index) => (
              <li key={index}>
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
                  <span>{formatDate(article.pubDate)}</span>
                  <span>—</span>
                  <span className="italic">{article.source}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
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
