'use client';

import { useState, useEffect } from 'react';
import { 
  FaRobot, 
  FaShieldAlt, 
  FaFilter, 
  FaToggleOn, 
  FaToggleOff,
  FaExclamationTriangle,
  FaTrash,
  FaPlus,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaEye,
  FaEdit
} from 'react-icons/fa';

interface AutomodRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'word_filter' | 'spam_filter' | 'caps_filter' | 'link_filter' | 'emoji_filter' | 'mention_filter';
  severity: 'low' | 'medium' | 'high';
  action: 'warn' | 'mute' | 'kick' | 'ban' | 'delete';
  triggers: string[];
  exemptRoles: string[];
  exemptChannels: string[];
  triggeredCount: number;
  lastTriggered?: string;
}

interface AutomodSettings {
  enabled: boolean;
  logChannel: string;
  muteDuration: number;
  maxWarnings: number;
  whitelistEnabled: boolean;
  whitelistWords: string[];
  autoDeleteEnabled: boolean;
  autoDeleteDelay: number;
}

export default function AutomodPage() {
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [settings, setSettings] = useState<AutomodSettings>({
    enabled: true,
    logChannel: '#automod-logs',
    muteDuration: 600,
    maxWarnings: 3,
    whitelistEnabled: true,
    whitelistWords: [],
    autoDeleteEnabled: true,
    autoDeleteDelay: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomodRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    loadAutomodData();
  }, []);

  const loadAutomodData = async () => {
    try {
      setLoading(true);
      
      // Фиктивные правила автомода
      const fakeRules: AutomodRule[] = [
        {
          id: '1',
          name: 'Фильтр нецензурной лексики',
          description: 'Блокирует сообщения с матом и оскорблениями',
          enabled: true,
          type: 'word_filter',
          severity: 'high',
          action: 'delete',
          triggers: ['мат', 'оскорбления', 'ругательства'],
          exemptRoles: ['Модератор', 'Администратор'],
          exemptChannels: [],
          triggeredCount: 47,
          lastTriggered: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          name: 'Антиспам',
          description: 'Предотвращает спам одинаковыми сообщениями',
          enabled: true,
          type: 'spam_filter',
          severity: 'medium',
          action: 'mute',
          triggers: ['дублирование', 'частота'],
          exemptRoles: ['Модератор'],
          exemptChannels: ['#spam-allowed'],
          triggeredCount: 23,
          lastTriggered: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          name: 'Фильтр CAPS',
          description: 'Предупреждает за сообщения в верхнем регистре',
          enabled: true,
          type: 'caps_filter',
          severity: 'low',
          action: 'warn',
          triggers: ['ВЕРХНИЙ РЕГИСТР'],
          exemptRoles: ['VIP', 'Модератор'],
          exemptChannels: [],
          triggeredCount: 156,
          lastTriggered: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '4',
          name: 'Фильтр ссылок',
          description: 'Блокирует подозрительные ссылки',
          enabled: false,
          type: 'link_filter',
          severity: 'medium',
          action: 'delete',
          triggers: ['http', 'https', 'discord.gg'],
          exemptRoles: ['Модератор', 'Активный'],
          exemptChannels: ['#ссылки'],
          triggeredCount: 12,
          lastTriggered: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '5',
          name: 'Фильтр эмодзи',
          description: 'Ограничивает количество эмодзи в сообщении',
          enabled: true,
          type: 'emoji_filter',
          severity: 'low',
          action: 'warn',
          triggers: ['🔥', '😂', '💀'],
          exemptRoles: ['VIP'],
          exemptChannels: ['#memes'],
          triggeredCount: 89,
          lastTriggered: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '6',
          name: 'Фильтр упоминаний',
          description: 'Предотвращает массовые упоминания',
          enabled: true,
          type: 'mention_filter',
          severity: 'high',
          action: 'kick',
          triggers: ['@everyone', '@here', 'массовые упоминания'],
          exemptRoles: ['Модератор', 'Администратор'],
          exemptChannels: [],
          triggeredCount: 5,
          lastTriggered: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setRules(fakeRules);
    } catch (error) {
      console.error('Error loading automod data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    // Симуляция сохранения
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setShowSettingsModal(false);
  };

  const deleteRule = async (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'word_filter': return <FaFilter className="w-4 h-4 text-red-500" />;
      case 'spam_filter': return <FaExclamationTriangle className="w-4 h-4 text-orange-500" />;
      case 'caps_filter': return <FaShieldAlt className="w-4 h-4 text-blue-500" />;
      case 'link_filter': return <FaFilter className="w-4 h-4 text-purple-500" />;
      case 'emoji_filter': return <FaFilter className="w-4 h-4 text-yellow-500" />;
      case 'mention_filter': return <FaExclamationTriangle className="w-4 h-4 text-pink-500" />;
      default: return <FaRobot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRuleTypeName = (type: string) => {
    switch (type) {
      case 'word_filter': return 'Фильтр слов';
      case 'spam_filter': return 'Антиспам';
      case 'caps_filter': return 'Фильтр CAPS';
      case 'link_filter': return 'Фильтр ссылок';
      case 'emoji_filter': return 'Фильтр эмодзи';
      case 'mention_filter': return 'Фильтр упоминаний';
      default: return 'Неизвестно';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'mute': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'kick': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'ban': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'delete': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const activeRules = rules.filter(rule => rule.enabled);
  const totalTriggers = rules.reduce((sum, rule) => sum + rule.triggeredCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Автоматическая модерация
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление правилами и настройками автомода
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <FaCog className="w-4 h-4" />
            Настройки
          </button>
          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Добавить правило
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего правил</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rules.length}</p>
            </div>
            <FaRobot className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Активных правил</p>
              <p className="text-2xl font-bold text-green-600">{activeRules.length}</p>
            </div>
            <FaCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Срабатываний</p>
              <p className="text-2xl font-bold text-orange-600">{totalTriggers}</p>
            </div>
            <FaExclamationTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Статус</p>
              <p className="text-2xl font-bold text-green-600">Активен</p>
            </div>
            <FaShieldAlt className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Правила автомодерации
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Правило
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Серьезность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Срабатываний
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
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {rule.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {rule.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRuleTypeIcon(rule.type)}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {getRuleTypeName(rule.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(rule.severity)}`}>
                      {rule.severity === 'low' ? 'Низкая' : rule.severity === 'medium' ? 'Средняя' : 'Высокая'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(rule.action)}`}>
                      {rule.action === 'warn' ? 'Предупреждение' : 
                       rule.action === 'mute' ? 'Мут' :
                       rule.action === 'kick' ? 'Кик' :
                       rule.action === 'ban' ? 'Бан' :
                       rule.action === 'delete' ? 'Удаление' : rule.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{rule.triggeredCount}</span>
                      {rule.lastTriggered && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(rule.lastTriggered).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="flex items-center gap-2"
                    >
                      {rule.enabled ? (
                        <FaToggleOn className="w-6 h-6 text-green-500" />
                      ) : (
                        <FaToggleOff className="w-6 h-6 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${rule.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {rule.enabled ? 'Включено' : 'Выключено'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowRuleModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Настройки автомода
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Канал логов
                </label>
                <input
                  type="text"
                  value={settings.logChannel}
                  onChange={(e) => setSettings({...settings, logChannel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Длительность мута (сек)
                </label>
                <input
                  type="number"
                  value={settings.muteDuration}
                  onChange={(e) => setSettings({...settings, muteDuration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Макс. предупреждений
                </label>
                <input
                  type="number"
                  value={settings.maxWarnings}
                  onChange={(e) => setSettings({...settings, maxWarnings: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedRule ? 'Просмотр правила' : 'Новое правило'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  placeholder="Введите название правила"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  rows={3}
                  placeholder="Описание правила"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тип
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Фильтр слов</option>
                    <option>Антиспам</option>
                    <option>Фильтр CAPS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Действие
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Предупреждение</option>
                    <option>Мут</option>
                    <option>Кик</option>
                    <option>Бан</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setSelectedRule(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setSelectedRule(null);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FaSave className="w-4 h-4" />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 