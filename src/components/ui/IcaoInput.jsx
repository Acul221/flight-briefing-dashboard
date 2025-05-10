export default function IcaoInput({ label, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        className="p-2 border rounded w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
    </div>
  );
}
