'use client';

import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaUserMinus, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaEye,
  FaUserShield,
  FaCrown,
  FaCalendarAlt,
  FaComments,
  FaDiscord,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaRobot,
  FaUserTie
} from 'react-icons/fa';

interface User {
  id: string;
  username: string;
  discriminator: string;
  globalName?: string;
  avatar?: string;
  nickname?: string;
  joinedAt: string;
  roles: Role[];
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isBot: boolean;
  permissions: string[];
  activity: UserActivity;
  warnings: number;
  invitedBy?: string;
  level: number;
  experience: number;
  messages: number;
  voiceTime: number;
  lastSeen: string;
  badges: string[];
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
  memberCount: number;
}

interface UserActivity {
  totalMessages: number;
  messagesThisWeek: number;
  voiceMinutes: number;
  voiceMinutesThisWeek: number;
  reactionsGiven: number;
  reactionsReceived: number;
  lastActivity: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  useEffect(() => {
    loadUsersData();
  }, []);

  const loadUsersData = async () => {
    try {
      setLoading(true);
      
      // Фиктивные роли
      const fakeRoles: Role[] = [
        {
          id: '1',
          name: 'Администратор',
          color: '#ff0000',
          permissions: ['ADMINISTRATOR'],
          position: 10,
          memberCount: 2
        },
        {
          id: '2',
          name: 'Модератор',
          color: '#ffaa00',
          permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'],
          position: 9,
          memberCount: 5
        },
        {
          id: '3',
          name: 'VIP',
          color: '#ff55ff',
          permissions: ['SEND_MESSAGES'],
          position: 8,
          memberCount: 15
        },
        {
          id: '4',
          name: 'Активный',
          color: '#00ff00',
          permissions: ['SEND_MESSAGES'],
          position: 7,
          memberCount: 47
        },
        {
          id: '5',
          name: 'Участник',
          color: '#0055ff',
          permissions: ['SEND_MESSAGES'],
          position: 6,
          memberCount: 234
        },
        {
          id: '6',
          name: '@everyone',
          color: '#99aab5',
          permissions: ['VIEW_CHANNEL'],
          position: 0,
          memberCount: 359
        }
      ];

      // Фиктивные пользователи
      const fakeUsers: User[] = [
        {
          id: '1',
          username: 'watdin',
          discriminator: '3046',
          globalName: 'Watdin',
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          nickname: 'Главный Админ',
          joinedAt: '2023-01-15T10:00:00Z',
          roles: [fakeRoles[0], fakeRoles[4], fakeRoles[5]],
          status: 'online',
          isBot: false,
          permissions: ['ADMINISTRATOR'],
          activity: {
            totalMessages: 2450,
            messagesThisWeek: 127,
            voiceMinutes: 1200,
            voiceMinutesThisWeek: 45,
            reactionsGiven: 543,
            reactionsReceived: 1234,
            lastActivity: new Date().toISOString()
          },
          warnings: 0,
          invitedBy: 'Создатель сервера',
          level: 15,
          experience: 12500,
          messages: 2450,
          voiceTime: 1200,
          lastSeen: new Date().toISOString(),
          badges: ['Основатель', 'Разработчик']
        },
        {
          id: '2',
          username: 'ModeratorBot',
          discriminator: '0001',
          globalName: 'Moderator Bot',
          avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
          nickname: 'Бот Модератор',
          joinedAt: '2023-01-15T10:30:00Z',
          roles: [fakeRoles[1], fakeRoles[5]],
          status: 'online',
          isBot: true,
          permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'],
          activity: {
            totalMessages: 567,
            messagesThisWeek: 89,
            voiceMinutes: 0,
            voiceMinutesThisWeek: 0,
            reactionsGiven: 12,
            reactionsReceived: 234,
            lastActivity: new Date().toISOString()
          },
          warnings: 0,
          level: 5,
          experience: 2500,
          messages: 567,
          voiceTime: 0,
          lastSeen: new Date().toISOString(),
          badges: ['Бот', 'Модератор']
        },
        {
          id: '3',
          username: 'ActiveUser',
          discriminator: '1234',
          globalName: 'Active User',
          avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
          nickname: 'Активный Участник',
          joinedAt: '2023-02-20T14:15:00Z',
          roles: [fakeRoles[3], fakeRoles[4], fakeRoles[5]],
          status: 'online',
          isBot: false,
          permissions: ['SEND_MESSAGES'],
          activity: {
            totalMessages: 1850,
            messagesThisWeek: 95,
            voiceMinutes: 780,
            voiceMinutesThisWeek: 67,
            reactionsGiven: 234,
            reactionsReceived: 567,
            lastActivity: new Date(Date.now() - 300000).toISOString()
          },
          warnings: 0,
          invitedBy: 'watdin#3046',
          level: 12,
          experience: 9250,
          messages: 1850,
          voiceTime: 780,
          lastSeen: new Date(Date.now() - 300000).toISOString(),
          badges: ['Верный', 'Активист']
        },
        {
          id: '4',
          username: 'VIPMember',
          discriminator: '5678',
          globalName: 'VIP Member',
          avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
          nickname: 'VIP Участник',
          joinedAt: '2023-03-10T16:30:00Z',
          roles: [fakeRoles[2], fakeRoles[4], fakeRoles[5]],
          status: 'idle',
          isBot: false,
          permissions: ['SEND_MESSAGES'],
          activity: {
            totalMessages: 945,
            messagesThisWeek: 23,
            voiceMinutes: 450,
            voiceMinutesThisWeek: 12,
            reactionsGiven: 123,
            reactionsReceived: 345,
            lastActivity: new Date(Date.now() - 3600000).toISOString()
          },
          warnings: 0,
          invitedBy: 'ActiveUser#1234',
          level: 8,
          experience: 4725,
          messages: 945,
          voiceTime: 450,
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          badges: ['VIP', 'Донатер']
        },
        {
          id: '5',
          username: 'NewUser',
          discriminator: '9012',
          globalName: 'New User',
          avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
          nickname: 'Новичок',
          joinedAt: '2024-01-05T09:45:00Z',
          roles: [fakeRoles[4], fakeRoles[5]],
          status: 'offline',
          isBot: false,
          permissions: ['SEND_MESSAGES'],
          activity: {
            totalMessages: 67,
            messagesThisWeek: 12,
            voiceMinutes: 45,
            voiceMinutesThisWeek: 8,
            reactionsGiven: 23,
            reactionsReceived: 34,
            lastActivity: new Date(Date.now() - 86400000).toISOString()
          },
          warnings: 0,
          invitedBy: 'VIPMember#5678',
          level: 2,
          experience: 335,
          messages: 67,
          voiceTime: 45,
          lastSeen: new Date(Date.now() - 86400000).toISOString(),
          badges: ['Новичок']
        },
        {
          id: '6',
          username: 'ProblematicUser',
          discriminator: '3456',
          globalName: 'Problematic User',
          avatar: 'https://cdn.discordapp.com/embed/avatars/5.png',
          nickname: 'Проблемный',
          joinedAt: '2023-11-12T11:20:00Z',
          roles: [fakeRoles[5]],
          status: 'dnd',
          isBot: false,
          permissions: ['SEND_MESSAGES'],
          activity: {
            totalMessages: 234,
            messagesThisWeek: 2,
            voiceMinutes: 12,
            voiceMinutesThisWeek: 0,
            reactionsGiven: 12,
            reactionsReceived: 5,
            lastActivity: new Date(Date.now() - 172800000).toISOString()
          },
          warnings: 3,
          invitedBy: 'Неизвестно',
          level: 3,
          experience: 1170,
          messages: 234,
          voiceTime: 12,
          lastSeen: new Date(Date.now() - 172800000).toISOString(),
          badges: ['Нарушитель']
        }
      ];

      setRoles(fakeRoles);
      setUsers(fakeUsers);
    } catch (error) {
      console.error('Error loading users data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Онлайн';
      case 'idle': return 'Отошел';
      case 'dnd': return 'Не беспокоить';
      case 'offline': return 'Не в сети';
      default: return 'Неизвестно';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.globalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.roles.some(role => role.id === filterRole);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'joinedAt':
        aVal = new Date(a.joinedAt).getTime();
        bVal = new Date(b.joinedAt).getTime();
        break;
      case 'messages':
        aVal = a.messages;
        bVal = b.messages;
        break;
      case 'level':
        aVal = a.level;
        bVal = b.level;
        break;
      case 'warnings':
        aVal = a.warnings;
        bVal = b.warnings;
        break;
      default:
        aVal = a.joinedAt;
        bVal = b.joinedAt;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const userStats = {
    total: users.length,
    online: users.filter(u => u.status === 'online').length,
    bots: users.filter(u => u.isBot).length,
    withWarnings: users.filter(u => u.warnings > 0).length,
    newThisWeek: users.filter(u => new Date(u.joinedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Пользователи
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление участниками сервера
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            {viewMode === 'table' ? 'Сетка' : 'Таблица'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.total}</p>
            </div>
            <FaUsers className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Онлайн</p>
              <p className="text-2xl font-bold text-green-600">{userStats.online}</p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Боты</p>
              <p className="text-2xl font-bold text-purple-600">{userStats.bots}</p>
            </div>
            <FaRobot className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">С предупреждениями</p>
              <p className="text-2xl font-bold text-yellow-600">{userStats.withWarnings}</p>
            </div>
            <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Новых за неделю</p>
              <p className="text-2xl font-bold text-indigo-600">{userStats.newThisWeek}</p>
            </div>
            <FaUserPlus className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все роли</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="online">Онлайн</option>
              <option value="idle">Отошел</option>
              <option value="dnd">Не беспокоить</option>
              <option value="offline">Не в сети</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="joinedAt">Дата входа</option>
              <option value="username">Имя</option>
              <option value="messages">Сообщения</option>
              <option value="level">Уровень</option>
              <option value="warnings">Предупреждения</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <FaSort className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Роли
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Присоединился
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Активность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Уровень
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {user.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <FaDiscord className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`}></div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.nickname || user.globalName || user.username}
                            </div>
                            {user.isBot && <FaRobot className="w-3 h-3 text-purple-500" />}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.username}#{user.discriminator}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        user.status === 'idle' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        user.status === 'dnd' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.filter(r => r.name !== '@everyone').slice(0, 2).map((role) => (
                          <span 
                            key={role.id} 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: role.color + '20', color: role.color }}
                          >
                            {role.name}
                          </span>
                        ))}
                        {user.roles.filter(r => r.name !== '@everyone').length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                            +{user.roles.filter(r => r.name !== '@everyone').length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.joinedAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{user.messages} сообщений</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor(user.voiceTime / 60)}ч в голосе
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.level}
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${((user.experience % 1000) / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedUsers.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {user.avatar ? (
                      <img className="h-12 w-12 rounded-full" src={user.avatar} alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <FaDiscord className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`}></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.nickname || user.globalName || user.username}
                      </div>
                      {user.isBot && <FaRobot className="w-3 h-3 text-purple-500" />}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.username}#{user.discriminator}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FaEye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Уровень</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Сообщений</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.messages}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Предупреждений</span>
                  <span className={`font-medium ${user.warnings > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {user.warnings}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {user.roles.filter(r => r.name !== '@everyone').slice(0, 3).map((role) => (
                    <span 
                      key={role.id} 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: role.color + '20', color: role.color }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Профиль пользователя
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedUser.avatar ? (
                    <img className="h-20 w-20 rounded-full" src={selectedUser.avatar} alt="" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <FaDiscord className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(selectedUser.status)}`}></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedUser.nickname || selectedUser.globalName || selectedUser.username}
                    </h4>
                    {selectedUser.isBot && <FaRobot className="w-5 h-5 text-purple-500" />}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedUser.username}#{selectedUser.discriminator}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getStatusText(selectedUser.status)}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.level}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Уровень</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.messages}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Сообщений</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.floor(selectedUser.voiceTime / 60)}ч
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">В голосе</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.warnings}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Предупреждений</div>
                </div>
              </div>

              {/* Roles */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Роли</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.map((role) => (
                    <span 
                      key={role.id} 
                      className="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
                      style={{ backgroundColor: role.color + '20', color: role.color }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Badges */}
              {selectedUser.badges.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Значки</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.badges.map((badge, index) => (
                      <span 
                        key={index} 
                        className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Активность</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Присоединился:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(selectedUser.joinedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Последняя активность:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(selectedUser.lastSeen).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Сообщений на этой неделе:</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedUser.activity.messagesThisWeek}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Пригласил:</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedUser.invitedBy || 'Неизвестно'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 