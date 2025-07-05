'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaShieldAlt,
  FaTicketAlt,
  FaChartBar,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaDiscord,
  FaRobot,
  FaComments,
} from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  // Фиктивные данные пользователя
  const fakeUser = {
    discordId: '123456789',
    avatar: 'default',
    username: 'Администратор',
    discriminator: '0001'
  };
  
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  // Загружаем количество открытых тикетов
  useEffect(() => {
    const loadTicketCount = async () => {
      try {
        const response = await fetch('/api/tickets?status=open&limit=1');
        if (response.ok) {
          const data = await response.json();
          setOpenTicketsCount(data.stats?.open || 0);
        }
      } catch (error) {
        console.error('Error loading ticket count:', error);
      }
    };

    loadTicketCount();
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadTicketCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    // Временно убираем выход - просто перезагружаем страницу
    window.location.href = '/';
  };

  const sidebarItems: SidebarItem[] = [
    { name: 'Дашборд', href: '/dashboard', icon: FaHome },
    { name: 'Модерация', href: '/dashboard/moderation', icon: FaShieldAlt },
    { 
      name: 'Тикеты', 
      href: '/dashboard/tickets', 
      icon: FaTicketAlt,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined
    },
    { name: 'Аналитика', href: '/dashboard/analytics', icon: FaChartBar },
    { name: 'Пользователи', href: '/dashboard/users', icon: FaUsers },
    { name: 'Автомод', href: '/dashboard/automod', icon: FaRobot },
    { name: 'Логи', href: '/dashboard/logs', icon: FaComments },
    { name: 'Настройки', href: '/dashboard/settings', icon: FaCog },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out z-30",
        // На mobile: показываем только когда открыт
        // На desktop: всегда показываем
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaDiscord className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors md:hidden"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaDiscord className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {fakeUser.username}
                </p>
                <p className="text-xs text-gray-400">
                  #{fakeUser.discriminator}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 custom-scrollbar overflow-y-auto">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span className="font-medium">На главную</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 