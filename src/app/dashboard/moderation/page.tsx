'use client';

import { useState, useEffect } from 'react';
import { 
  FaUserShield, 
  FaBan, 
  FaExclamationTriangle, 
  FaTrash, 
  FaEye,
  FaSearch,
  FaFilter,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaUserSlash,
  FaHistory,
  FaDiscord
} from 'react-icons/fa';

interface ModerationAction {
  id: string;
  type: 'ban' | 'kick' | 'warn' | 'mute' | 'unban';
  userId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  moderator: string;
  reason: string;
  timestamp: string;
  duration?: string;
  active: boolean;
}

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  nickname?: string;
  roles: string[];
  joinedAt: string;
  messages: number;
  warnings: number;
  isBanned: boolean;
  isMuted: boolean;
}

export default function ModerationPage() {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      
      // Фиктивные данные модерации
      const fakeActions: ModerationAction[] = [
        {
          id: '1',
          type: 'ban',
          userId: '123456789',
          username: 'BadUser',
          discriminator: '1234',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          moderator: 'AdminBot#0001',
          reason: 'Спам в чате',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          active: true
        },
        {
          id: '2',
          type: 'warn',
          userId: '987654321',
          username: 'NaughtyUser',
          discriminator: '5678',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
          moderator: 'AdminBot#0001',
          reason: 'Нарушение правил чата',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          active: true
        },
        {
          id: '3',
          type: 'mute',
          userId: '456789123',
          username: 'LoudUser',
          discriminator: '9012',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
          moderator: 'AdminBot#0001',
          reason: 'Флуд в голосовом канале',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          duration: '24h',
          active: true
        },
        {
          id: '4',
          type: 'kick',
          userId: '789123456',
          username: 'TrollUser',
          discriminator: '3456',
          avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
          moderator: 'AdminBot#0001',
          reason: 'Оффтоп в серьезном канале',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          active: false
        },
        {
          id: '5',
          type: 'unban',
          userId: '321654987',
          username: 'ReformedUser',
          discriminator: '7890',
          avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
          moderator: 'AdminBot#0001',
          reason: 'Истек срок бана',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          active: false
        }
      ];

      const fakeUsers: User[] = [
        {
          id: '111111111',
          username: 'ActiveUser',
          discriminator: '1111',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          nickname: 'Активный пользователь',
          roles: ['@everyone', 'Участник'],
          joinedAt: '2024-01-15T10:00:00Z',
          messages: 1250,
          warnings: 0,
          isBanned: false,
          isMuted: false
        },
        {
          id: '222222222',
          username: 'ProblematicUser',
          discriminator: '2222',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
          nickname: 'Проблемный',
          roles: ['@everyone'],
          joinedAt: '2024-02-10T14:30:00Z',
          messages: 87,
          warnings: 3,
          isBanned: false,
          isMuted: true
        },
        {
          id: '333333333',
          username: 'BannedUser',
          discriminator: '3333',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
          roles: ['@everyone'],
          joinedAt: '2024-03-05T09:15:00Z',
          messages: 45,
          warnings: 5,
          isBanned: true,
          isMuted: false
        },
        {
          id: '444444444',
          username: 'GoodUser',
          discriminator: '4444',
          avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
          nickname: 'Хороший пользователь',
          roles: ['@everyone', 'Участник', 'Активный'],
          joinedAt: '2023-12-01T16:45:00Z',
          messages: 3420,
          warnings: 0,
          isBanned: false,
          isMuted: false
        }
      ];

      setActions(fakeActions);
      setUsers(fakeUsers);
    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = (action: string, userId: string, reason: string) => {
    console.log(`Moderation action: ${action} for user ${userId} with reason: ${reason}`);
    // Здесь будет API вызов
    setShowModerationModal(false);
    setSelectedUser(null);
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || action.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(user => {
    return user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ban': return <FaBan className="w-4 h-4 text-red-500" />;
      case 'kick': return <FaUserSlash className="w-4 h-4 text-orange-500" />;
      case 'warn': return <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />;
      case 'mute': return <FaUserShield className="w-4 h-4 text-blue-500" />;
      case 'unban': return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      default: return <FaHistory className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'ban': return 'Бан';
      case 'kick': return 'Кик';
      case 'warn': return 'Предупреждение';
      case 'mute': return 'Мут';
      case 'unban': return 'Разбан';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Модерация
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление участниками и модерацией сервера
          </p>
        </div>
        <button
          onClick={() => setShowModerationModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Действие
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск по пользователю или причине..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все действия</option>
            <option value="ban">Баны</option>
            <option value="kick">Кики</option>
            <option value="warn">Предупреждения</option>
            <option value="mute">Муты</option>
            <option value="unban">Разбаны</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Активные баны</p>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
            <FaBan className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Предупреждения</p>
              <p className="text-2xl font-bold text-yellow-600">12</p>
            </div>
            <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Активные муты</p>
              <p className="text-2xl font-bold text-blue-600">2</p>
            </div>
            <FaUserShield className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего действий</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
            </div>
            <FaHistory className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Последние действия
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Причина
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Модератор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredActions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {action.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={action.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <FaDiscord className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.username}#{action.discriminator}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {action.userId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(action.type)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {getActionText(action.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {action.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {action.moderator}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(action.timestamp).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      action.active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {action.active ? 'Активно' : 'Неактивно'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Пользователи сервера
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Роли
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Присоединился
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сообщения
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Предупреждения
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <FaDiscord className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.nickname || user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.username}#{user.discriminator}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.slice(0, 2).map((role, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {role}
                        </span>
                      ))}
                      {user.roles.length > 2 && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.joinedAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.messages.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.warnings > 0
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {user.warnings}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.isBanned && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Забанен
                        </span>
                      )}
                      {user.isMuted && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Замучен
                        </span>
                      )}
                      {!user.isBanned && !user.isMuted && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Активен
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModerationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerationAction('warn', user.id, 'Предупреждение')}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        <FaExclamationTriangle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerationAction('ban', user.id, 'Нарушение правил')}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaBan className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Modal */}
      {showModerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Модерация пользователя
            </h3>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <FaDiscord className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.nickname || selectedUser.username}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.username}#{selectedUser.discriminator}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleModerationAction('warn', selectedUser.id, 'Предупреждение')}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm"
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                    Предупреждение
                  </button>
                  <button
                    onClick={() => handleModerationAction('mute', selectedUser.id, 'Мут')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm"
                  >
                    <FaUserShield className="w-4 h-4" />
                    Мут
                  </button>
                  <button
                    onClick={() => handleModerationAction('kick', selectedUser.id, 'Кик')}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm"
                  >
                    <FaUserSlash className="w-4 h-4" />
                    Кик
                  </button>
                  <button
                    onClick={() => handleModerationAction('ban', selectedUser.id, 'Бан')}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm"
                  >
                    <FaBan className="w-4 h-4" />
                    Бан
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModerationModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 