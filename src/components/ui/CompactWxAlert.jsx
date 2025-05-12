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
  const { alerts = [], loading, lastUpdated, refresh } = useAlerts();

  if (loading && alerts.length === 0) return null; // prevent flashing

  return (
    <motion.div
      className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 rounded-2xl px-4 py-4 shadow-md text-sm font-medium space-y-3 transition-all duration-300"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-semibold text-red-700 dark:text-red-300 mb-0.5">
            ⚠️ Weather Alerts
          </h2>
          {lastUpdated && (
            <p className="text-xs text-red-500 dark:text-red-400">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {typeof refresh === 'function' && (
          <motion.button
            onClick={refresh}
            disabled={loading}
            whileTap={{ scale: 0.95 }}
            className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 transition"
          >
            {loading ? '🔄 Loading...' : '🔄 Update'}
          </motion.button>
        )}
      </div>

      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="flex items-start gap-2 border-l-2 border-red-400/40 pl-2"
        >
          <span className="text-lg">{alertIcons[alert.type] || '🔔'}</span>
          <div className="space-y-0.5">
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
            {alert.type && (
              <div className="text-xs text-red-400 dark:text-red-500 italic">
                Source: {alert.type}
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default CompactWxAlert;
