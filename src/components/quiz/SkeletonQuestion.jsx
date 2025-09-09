export default function SkeletonQuestion() {
  return (
    <div className="mb-6 border p-4 rounded-lg bg-white dark:bg-gray-800 shadow overflow-hidden">
      <div className="animate-pulse">
        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}
