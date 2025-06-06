export function Input(props) {
    return (
      <input
        {...props}
        className={`border border-gray-300 rounded px-3 py-2 w-full 
          focus:outline-none focus:ring-2 focus:ring-blue-500
          dark:bg-gray-800 dark:text-white dark:border-gray-600
          ${props.className || ''}`}
      />
    );
  }
  