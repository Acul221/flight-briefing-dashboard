import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

function Breadcrumb({ items = [] }) {
  return (
    <nav className="text-sm text-gray-500 dark:text-gray-300 mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {idx > 0 && <span className="mx-2">/</span>}
            {item.to ? (
              <Link
                to={item.to}
                className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-white">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      to: PropTypes.string,
    })
  ),
};
