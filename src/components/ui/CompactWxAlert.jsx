import { motion } from 'framer-motion';
import useAlerts from '@/hooks/useAlerts';

const CompactWxAlert = () => {
  const { alerts, loading } = useAlerts();

  if (loading || alerts.length === 0) return null;

  return (
    <motion.div
      className="w-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 shadow-md text-sm font-medium flex flex-col gap-1"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {alerts.map((alert, i) => (
        <div key={i}>
          {getIcon(alert.type)} {alert.message}
        </div>
      ))}
    </motion.div>
  );
};

const getIcon = (type) => {
  if (type === 'SIGMET') return '⚠️';
  if (type === 'Volcano') return '🌋';
  if (type === 'TC') return '🌀';
  return '🌩️';
};

export default CompactWxAlert;
