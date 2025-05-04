export function Card({ children }) {
    return <div className="bg-white dark:bg-gray-900 shadow rounded-lg">{children}</div>;
  }
  
  export function CardContent({ children, className }) {
    return <div className={`p-4 ${className}`}>{children}</div>;
  }
  