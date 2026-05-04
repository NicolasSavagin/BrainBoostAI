// src/components/MobileBottomNav.jsx - NAVEGAÇÃO EXTRA PARA MOBILE

import { NavLink } from 'react-router-dom';
import { 
  Home,
  BookOpen,
  Trophy,
  Users,
  User
} from 'lucide-react';

export default function MobileBottomNav() {
  const mainNav = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Aprender', href: '/learn', icon: BookOpen },
    { name: 'Ranking', href: '/leaderboard', icon: Trophy },
    { name: 'Comunidade', href: '/community', icon: Users },
    { name: 'Perfil', href: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-bottom">
      <div className="grid grid-cols-5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}