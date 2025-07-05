'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { FaDiscord } from 'react-icons/fa';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <FaDiscord className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Discord Admin Panel
          </h2>
          <p className="text-gray-300">
            Мощная панель управления для вашего Discord сервера
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-white/20">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Войдите в систему
              </h3>
              <p className="text-gray-300 text-sm">
                Используйте свой Discord аккаунт для входа
              </p>
            </div>

            <button
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Подключение...</span>
                </>
              ) : (
                <>
                  <FaDiscord className="h-5 w-5" />
                  <span>Войти через Discord</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Входя в систему, вы соглашаетесь с условиями использования
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">
            Возможности панели:
          </h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Модерация с AI поддержкой
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Система тикетов
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Аналитика и статистика
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Гибкие настройки
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 