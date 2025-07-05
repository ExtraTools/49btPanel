import { FaUser, FaTicketAlt, FaShieldAlt, FaComments, FaRobot, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Activity {
  id: string;
  type: string;
  event: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface RecentActivityProps {
  activities: Activity[];
}

function getActivityIcon(type: string, event: string) {
  switch (type) {
    case 'member':
      return <FaUser className="w-4 h-4" />;
    case 'ticket':
      return <FaTicketAlt className="w-4 h-4" />;
    case 'moderation':
      return <FaShieldAlt className="w-4 h-4" />;
    case 'message':
      return <FaComments className="w-4 h-4" />;
    case 'automod':
      return <FaRobot className="w-4 h-4" />;
    case 'system':
      return <FaRobot className="w-4 h-4" />;
    default:
      return <FaExclamationTriangle className="w-4 h-4" />;
  }
}

function getActivityColor(type: string, event: string) {
  switch (type) {
    case 'member':
      return event === 'join' ? 'bg-green-500' : 'bg-red-500';
    case 'ticket':
      return event === 'create' ? 'bg-blue-500' : 'bg-gray-500';
    case 'moderation':
      return 'bg-yellow-500';
    case 'message':
      return 'bg-purple-500';
    case 'automod':
      return 'bg-orange-500';
    case 'system':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  // Если нет активности, показываем фиктивные данные
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'member',
      event: 'join',
      message: 'Пользователь @NewUser присоединился к серверу',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 минут назад
    },
    {
      id: '2',
      type: 'moderation',
      event: 'warn',
      message: 'Выдано предупреждение пользователю @BadUser за спам',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 минут назад
    },
    {
      id: '3',
      type: 'ticket',
      event: 'create',
      message: 'Создан новый тикет #0001 от @HelpUser',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
    },
    {
      id: '4',
      type: 'message',
      event: 'delete',
      message: 'Удалено сообщение в канале #general',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 минут назад
    },
    {
      id: '5',
      type: 'automod',
      event: 'trigger',
      message: 'Автомод заблокировал ссылку от @SpamUser',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 час назад
    },
    {
      id: '6',
      type: 'system',
      event: 'bot_start',
      message: 'Discord бот успешно запущен и подключен',
      timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 часа назад
    }
  ];

  const displayActivities = (activities && activities.length > 0) ? activities : mockActivities;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Последняя активность
          </h3>
          {activities && activities.length === 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              Примерные данные
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {displayActivities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${getActivityColor(activity.type, activity.event)}`}>
                {getActivityIcon(activity.type, activity.event)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true, 
                    locale: ru 
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {displayActivities.length > 10 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Показать больше активности →
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 