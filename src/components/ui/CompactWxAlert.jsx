import { motion } from 'framer-motion';
import useAlerts from '@/hooks/useAlerts';

const alertIcons = {
  GIS: '🌀',
  Outlook: '📢',
  Summary: '📋',
  BMKG: '🌋',
  Atlantic: '🌊',
  SIGMET: '⚠️',
  Volcano: '🌋',
  TC: '🌀',
};

const CompactWxAlert = () => {
  const { alerts, loading, lastUpdated, refresh } = useAlerts();

  if (loading || alerts.length === 0) return null;

  return (
    <motion.div
      className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 shadow-md text-sm font-medium space-y-2"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-base font-semibold text-red-700 dark:text-red-300">
          ⚠️ Weather Alerts
        </h2>
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
          <button
            onClick={refresh}
            className="px-2 py-0.5 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded text-xs font-semibold"
          >
            🔄 Update
          </button>
        </div>
      </div>

      {alerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-2 leading-snug">
          <span>{alertIcons[alert.type] || '🔔'}</span>
          {alert.link ? (
            <a
              href={alert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-600 dark:hover:text-red-300"
            >
              {alert.message}
            </a>
          ) : (
            <span>{alert.message}</span>
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default CompactWxAlert;
