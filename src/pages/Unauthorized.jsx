export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-4">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600 dark:text-gray-300">
        You do not have permission to view this page.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Dashboard
      </a>
    </div>
  );
}
