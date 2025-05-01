function AirportSelector() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
        Select Airport
      </label>
      <select
        className="w-full p-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
      >
        <option value="WIII">WIII - Soekarno-Hatta</option>
        <option value="WADD">WADD - Ngurah Rai</option>
        <option value="WARR">WARR - Juanda</option>
      </select>
    </div>
  );
}

export default AirportSelector;
