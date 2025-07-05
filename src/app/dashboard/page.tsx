'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaComments, 
  FaShieldAlt, 
  FaTicketAlt,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaRobot,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { formatNumber, formatPercent } from '@/lib/utils';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center">
              {change > 0 ? (
                <FaArrowUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <FaArrowDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(Math.abs(change))}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface Activity {
  id: string;
  type: 'user_join' | 'message_delete' | 'warning' | 'ticket_create' | 'automod';
  message: string;
  timestamp: Date;
  user?: {
    username: string;
    avatar?: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Фиктивные данные пользователя
  const fakeUser = {
    username: 'Администратор'
  };

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    moderationActions: 0,
    openTickets: 0,
    loading: true,
    error: null as string | null,
  });

  const [activities, setActivities] = useState<Activity[]>([]);

  const handleUserManagement = () => {
    console.log('Переход к управлению пользователями');
    // router.push('/dashboard/users');
  };

  const handleModerationSettings = () => {
    console.log('Переход к настройкам модерации');
    router.push('/dashboard/settings');
  };

  const handleAutoModSettings = () => {
    console.log('Переход к настройкам автомода');
    // router.push('/dashboard/automod');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        // Добавляем таймаут для запроса
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
        
        const response = await fetch('/api/stats?timeRange=7d', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        setStats({
          totalUsers: data.overview?.totalMembers || 147,
          totalMessages: data.channels?.totalMessages || 1234,
          moderationActions: data.moderation?.total || 23,
          openTickets: data.tickets?.open || 5,
          loading: false,
          error: null,
        });

        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        let errorMessage = 'Не удалось загрузить данные. ';
        if (error.name === 'AbortError') {
          errorMessage += 'Превышено время ожидания (10 сек).';
        } else {
          errorMessage += 'Используются примерные значения.';
        }
        
        setStats({
          totalUsers: 147,
          totalMessages: 1234,
          moderationActions: 23,
          openTickets: 5,
          loading: false,
          error: errorMessage,
        });
      }
    };

    loadData();
  }, []);

  if (stats.loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Welcome section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="animate-pulse">
            <div className="h-6 bg-white/20 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-2/3"></div>
          </div>
        </div>

        {/* Skeleton Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="animate-pulse h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="p-6">
              <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="animate-pulse h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Статус загрузки */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Загрузка данных...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Добро пожаловать, {fakeUser?.username}!
        </h1>
        <p className="text-blue-100">
          Управляйте своим Discord сервером с помощью современной админ панели
        </p>
        {stats.error && (
          <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-100 text-sm">
              ⚠️ {stats.error}
            </p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Всего пользователей"
          value={stats.totalUsers}
          change={5.2}
          icon={FaUsers}
          color="blue"
        />
        <StatCard
          title="Сообщений за день"
          value={stats.totalMessages}
          change={12.5}
          icon={FaComments}
          color="green"
        />
        <StatCard
          title="Действия модерации"
          value={stats.moderationActions}
          change={-8.3}
          icon={FaShieldAlt}
          color="yellow"
        />
        <StatCard
          title="Открытые тикеты"
          value={stats.openTickets}
          change={2.1}
          icon={FaTicketAlt}
          color="red"
        />
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Статистика активности
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Часовая активность */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Активность по часам (последние 24 часа)
                </h4>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 24 }, (_, i) => {
                    const activity = Math.floor(Math.random() * 50) + 10;
                    const height = Math.max((activity / 60) * 100, 10);
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-sm mb-1 transition-all hover:bg-blue-600"
                          style={{ height: `${height}px` }}
                          title={`${i}:00 - ${activity} действий`}
                        ></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {i.toString().padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Статистика по типам */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Команды
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        156
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">⚡</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Сообщения
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                        1.2K
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">💬</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Статус системы */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Система работает стабильно
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Обновлено: {new Date().toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecentActivity activities={activities} />
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Быстрые действия
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleUserManagement}
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-200 cursor-pointer border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:scale-105"
            >
              <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                <FaUsers className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-medium text-blue-900 dark:text-blue-300 block">
                  Управление пользователями
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Роли, права, участники
                </span>
              </div>
            </button>
            
            <button 
              onClick={handleModerationSettings}
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-200 cursor-pointer border border-green-200/50 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg hover:scale-105"
            >
              <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                <FaShieldAlt className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-medium text-green-900 dark:text-green-300 block">
                  Настройки модерации
                </span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Автомод, предупреждения
                </span>
              </div>
            </button>
            
            <button 
              onClick={handleAutoModSettings}
              className="group flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-200 cursor-pointer border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:scale-105"
            >
              <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                <FaRobot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-medium text-purple-900 dark:text-purple-300 block">
                  Настройки автомода
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  Фильтры, автоответы
                </span>
              </div>
            </button>
          </div>
          
          {/* Дополнительные быстрые действия */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors cursor-pointer">
                <FaTicketAlt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Тикеты</span>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer">
                <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Логи</span>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
                <FaCheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Статус</span>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-pointer">
                <FaComments className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Чат</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 