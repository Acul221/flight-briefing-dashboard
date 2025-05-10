export default function SectionTitle({ icon = "", title }) {
  return (
    <h3 className="text-lg font-semibold text-gray-700 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1 mb-2 flex items-center gap-2">
      <span>{icon}</span>
      <span>{title}</span>
    </h3>
  );
}
