// src/components/ui/StatCard.jsx

function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl shadow transition-colors duration-300">
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default StatCard;
