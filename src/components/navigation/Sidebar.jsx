import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Target, 
  TrendingUp, 
  User, 
  Trophy,
  Brain,
  ChevronLeft,
  MessageCircle ,
  Award ,
  ChevronRight
} from 'lucide-react';
import { useUIStore } from '../../store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Aprender', href: '/learn', icon: BookOpen },
  { name: 'Tutor Virtual', href: '/tutor', icon: MessageCircle }, 
  { name: 'Praticar', href: '/practice', icon: Target },
  { name: 'Progresso', href: '/progress', icon: TrendingUp },
  { name: 'Ranking', href: '/leaderboard', icon: Trophy },
  { name: 'Perfil', href: '/profile', icon: User },
  { name: 'Conquistas', href: '/achievements', icon: Award }, 
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Brain size={24} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              AI Learn
            </span>
          )}
        </div>
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={!sidebarOpen ? item.name : ''}
            >
              <Icon size={22} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
