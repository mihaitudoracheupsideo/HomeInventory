import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { usePageTitle } from '../contexts/PageTitleContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { setTitle } = usePageTitle();
  const [isCompact, setIsCompact] = useState(false);

  const menuItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', title: 'Dashboard', icon: '📊', path: '/' },
    { id: 'items', label: 'All Items', title: 'Obiecte', icon: '📦', path: '/objects' },
    { id: 'boxes', label: 'Boxes', title: 'Cutii', icon: '📦', path: '/boxes' },
    { id: 'locations', label: 'Locations', title: 'Locații', icon: '📍', path: '/locations' },
    { id: 'search', label: 'Search', title: 'Căutare', icon: '🔍', path: '/search' },
    { id: 'settings', label: 'Settings', title: 'Setări', icon: '⚙️', path: '/settings' },
  ], []);

  const isActive = useCallback((path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  }, [location.pathname]);

  // Set title based on current route
  useEffect(() => {
    const currentItem = menuItems.find(item => isActive(item.path));
    if (currentItem) {
      setTitle(currentItem.title);
    }
  }, [location.pathname, setTitle, menuItems, isActive]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1024); // lg breakpoint
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed 18% width */}
      <div className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-[18%] bg-slate-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40
        transform transition-transform duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Navigation */}
        <nav className="p-4 h-full overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map(item => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => {
                    onClose();
                    setTitle(item.title);
                  }}
                  className={`
                    flex items-center px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden
                    ${isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                    ${isCompact ? 'justify-center px-2' : 'justify-start'}
                  `}
                  title={isCompact ? item.label : undefined}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                    {item.icon}
                  </span>
                  {!isCompact && (
                    <span className="font-medium ml-3 truncate">{item.label}</span>
                  )}
                  {isActive(item.path) && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-fade-in flex-shrink-0" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700">
          <div className={`text-xs text-gray-500 dark:text-gray-400 text-center ${isCompact ? 'px-2' : ''}`}>
            {isCompact ? 'HI' : 'HomeInventory v1.0'}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;