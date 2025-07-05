'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Определяем заголовок страницы
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Дашборд';
      case '/dashboard/moderation':
        return 'Модерация';
      case '/dashboard/tickets':
        return 'Тикеты';
      case '/dashboard/analytics':
        return 'Аналитика';
      case '/dashboard/users':
        return 'Пользователи';
      case '/dashboard/automod':
        return 'Автомодерация';
      case '/dashboard/logs':
        return 'Логи';
      case '/dashboard/settings':
        return 'Настройки';
      default:
        return 'Дашборд';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        "md:ml-64"
      )}>
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle()}
        />
        
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 