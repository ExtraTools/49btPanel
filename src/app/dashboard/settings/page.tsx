'use client';

import { useState, useEffect } from 'react';
import { 
  FaDiscord, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaServer,
  FaRobot,
  FaShieldAlt,
  FaCog,
  FaUsers,
  FaSync
} from 'react-icons/fa';

interface DiscordStatus {
  connected: boolean;
  bot?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    verified: boolean;
    bot: boolean;
  };
  guild?: {
    id: string;
    name: string;
    memberCount: number;
    icon: string | null;
    owner: string;
    createdAt: string;
    botJoinedAt: string;
    permissions: string[];
  };
  permissions?: {
    administrator: boolean;
    manageGuild: boolean;
    manageChannels: boolean;
    manageRoles: boolean;
    manageMessages: boolean;
    kickMembers: boolean;
    banMembers: boolean;
    moderateMembers: boolean;
  };
  stats?: {
    guilds: number;
    channels: number;
    users: number;
    uptime: number;
    ping: number;
  };
  error?: string;
}

export default function SettingsPage() {
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDiscordStatus();
  }, []);

  const checkDiscordStatus = async () => {
    try {
      setLoading(true);
      
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 секунд таймаут
      
      const response = await fetch('/api/discord/status', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      setDiscordStatus(data);
    } catch (error) {
      console.error('Error checking Discord status:', error);
      
      let errorMessage = 'Не удалось проверить статус';
      if (error.name === 'AbortError') {
        errorMessage = 'Превышено время ожидания (8 сек)';
      }
      
      setDiscordStatus({ connected: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}д ${hours % 24}ч ${minutes % 60}м`;
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Настройки системы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление конфигурацией Discord админ панели
          </p>
        </div>
        <button
          onClick={checkDiscordStatus}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить статус
        </button>
      </div>

      {/* Discord Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FaDiscord className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Статус Discord бота
            </h2>
            {loading ? (
              <FaSpinner className="w-5 h-5 text-blue-500 animate-spin" />
            ) : discordStatus?.connected ? (
              <FaCheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <FaTimesCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Проверка подключения...
              </span>
            </div>
          ) : discordStatus?.connected ? (
            <div className="space-y-6">
              {/* Bot Info */}
              {discordStatus.bot && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    {discordStatus.bot.avatar ? (
                      <img
                        src={discordStatus.bot.avatar}
                        alt="Bot Avatar"
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <FaRobot className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {discordStatus.bot.username}#{discordStatus.bot.discriminator}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {discordStatus.bot.id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {discordStatus.bot.verified && (
                          <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                            Верифицирован
                          </span>
                        )}
                        <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                          Онлайн
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guild Info */}
              {discordStatus.guild && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    {discordStatus.guild.icon ? (
                      <img
                        src={discordStatus.guild.icon}
                        alt="Server Icon"
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <FaServer className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {discordStatus.guild.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {discordStatus.guild.id}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaUsers className="w-3 h-3" />
                          {discordStatus.guild.memberCount} участников
                        </span>
                        <span>
                          Бот подключен: {new Date(discordStatus.guild.botJoinedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions */}
              {discordStatus.permissions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Права бота
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(discordStatus.permissions).map(([key, value]) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          value 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {value ? (
                          <FaCheckCircle className="w-4 h-4" />
                        ) : (
                          <FaTimesCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {key === 'administrator' && 'Администратор'}
                          {key === 'manageGuild' && 'Управление сервером'}
                          {key === 'manageChannels' && 'Управление каналами'}
                          {key === 'manageRoles' && 'Управление ролями'}
                          {key === 'manageMessages' && 'Управление сообщениями'}
                          {key === 'kickMembers' && 'Исключение участников'}
                          {key === 'banMembers' && 'Блокировка участников'}
                          {key === 'moderateMembers' && 'Модерация участников'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {discordStatus.stats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Статистика бота
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discordStatus.stats.guilds}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Серверы</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discordStatus.stats.channels}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Каналы</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discordStatus.stats.users}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Пользователи</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discordStatus.stats.ping}ms
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Пинг</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatUptime(discordStatus.stats.uptime)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Время работы</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ошибка подключения к Discord
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {discordStatus?.error || 'Не удалось подключиться к Discord API'}
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Возможные причины:
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Неверный токен бота</li>
                  <li>• Бот не добавлен на сервер</li>
                  <li>• Недостаточно прав у бота</li>
                  <li>• Проблемы с сетевым подключением</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FaCog className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Конфигурация
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discord Bot Token
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="password"
                  value="MTEyOTUzMDU4Mjc0NjAyNjAzNQ.••••••••••••••••••••••••••••••••••••••••••"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✅ Настроен
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discord Guild ID
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value="1369754088941682830"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✅ Настроен
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                ℹ️ Информация
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Конфигурация загружается из переменных окружения .env файла. 
                Все настройки применяются автоматически при запуске системы.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 