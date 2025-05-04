export function Button({ children, className = '', ...props }) {
    return (
      <button
        {...props}
        className={`bg-blue-600 hover:bg-blue-700 text-white
            dark:bg-blue-500 dark:hover:bg-blue-600
            px-4 py-2 rounded transition ${className}`}          
      >
        {children}
      </button>
    );
  }
  