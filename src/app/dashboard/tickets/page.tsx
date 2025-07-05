'use client';

import { useState, useEffect } from 'react';
import {
  FaTicketAlt,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaLock,
  FaUser,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { formatRelativeTime, formatDate, cn } from '@/lib/utils';

interface Ticket {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'closed';
  assignedTo?: string;
  assignedToUsername?: string;
  createdAt: Date;
  closedAt?: Date;
  messageCount: number;
  lastActivity: Date;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const priorityIcons = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  urgent: '🆘'
};

const statusIcons = {
  open: '📂',
  in_progress: '⚙️',
  closed: '✅'
};

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            <FaTicketAlt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Тикет #{ticket.id.slice(-6)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ticket.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            priorityColors[ticket.priority]
          )}>
            {priorityIcons[ticket.priority]} {ticket.priority.toUpperCase()}
          </span>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            statusColors[ticket.status]
          )}>
            {statusIcons[ticket.status]} {ticket.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FaUser className="w-4 h-4" />
          <span>{ticket.username}</span>
          {ticket.assignedToUsername && (
            <>
              <span>•</span>
              <span>Назначен: {ticket.assignedToUsername}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FaClock className="w-4 h-4" />
          <span>Создан: {formatRelativeTime(ticket.createdAt)}</span>
          <span>•</span>
          <span>{ticket.messageCount} сообщений</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Последняя активность: {formatRelativeTime(ticket.lastActivity)}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              <FaEye className="w-4 h-4" />
            </button>
            {ticket.status !== 'closed' && (
              <>
                <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  <FaUser className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <FaLock className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      
      const response = await fetch(`/api/tickets?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        console.error('Failed to fetch tickets');
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление тикетами
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Просматривайте и управляйте тикетами поддержки
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <FaPlus className="w-4 h-4" />
          Создать панель тикетов
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Всего тикетов"
          value={stats.total}
          icon={FaTicketAlt}
          color="bg-blue-500"
        />
        <StatCard
          title="Открыты"
          value={stats.open}
          icon={FaExclamationTriangle}
          color="bg-yellow-500"
        />
        <StatCard
          title="В работе"
          value={stats.inProgress}
          icon={FaUser}
          color="bg-purple-500"
        />
        <StatCard
          title="Закрыты"
          value={stats.closed}
          icon={FaCheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по пользователю, категории или ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Все статусы</option>
              <option value="open">Открыты</option>
              <option value="in_progress">В работе</option>
              <option value="closed">Закрыты</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FaTimesCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Тикеты не найдены
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Попробуйте изменить параметры поиска или создать новый тикет
          </p>
        </div>
      )}
    </div>
  );
} 