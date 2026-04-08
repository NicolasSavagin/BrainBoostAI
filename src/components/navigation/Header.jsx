import { Bell, Sun, Moon, LogOut, Settings } from 'lucide-react';
import { useAuthStore, useThemeStore, useNotificationStore } from '../../store';
import authService from '../../services/authService';
import { useState } from 'react';
import NotificationPanel from '../common/NotificationPanel';


export default function Header() {
  const { user, userProfile } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
      {/* Left - Search or Title */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Olá, {user?.displayName || 'Estudante'}! 👋
        </h2>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Alternar tema"
        >
          {theme === 'light' ? (
            <Moon size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <Sun size={20} className="text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        <NotificationPanel />
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nível {userProfile?.level || 1}
              </p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                onClick={() => setShowProfile(false)}
              >
                <Settings size={16} />
                <span>Configurações</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
