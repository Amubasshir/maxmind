/**
 * Loader Component
 *
 * A simple loading spinner to display during API calls.
 */

export default function Loader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  );
}
