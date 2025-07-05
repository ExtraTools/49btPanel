import { Events } from 'discord.js';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: any, bot: DiscordBot) {
    try {
      logger.info(`🟢 Discord Bot готов! Подключен как ${client.user.tag}`);
      logger.info(`📊 Активен на ${client.guilds.cache.size} серверах`);
      logger.info(`👥 Обслуживает ${client.users.cache.size} пользователей`);
      
      // Установка статуса
      client.user.setActivity('Управление сервером', { type: 3 }); // Watching
      
      // Логирование успешного подключения
      await bot.logAction({
        type: 'system',
        message: 'Bot started successfully',
        guildId: process.env.DISCORD_GUILD_ID || 'unknown',
        userId: client.user.id,
        data: {
          guilds: client.guilds.cache.size,
          users: client.users.cache.size,
        },
      });
    } catch (error) {
      logger.error('Error in ready event:', error);
    }
  },
}; 