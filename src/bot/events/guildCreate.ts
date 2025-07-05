import { Events, Guild } from 'discord.js';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild: Guild, bot: DiscordBot) {
    try {
      logger.info(`🎉 Добавлен на новый сервер: ${guild.name} (ID: ${guild.id})`);
      logger.info(`👥 Участников: ${guild.memberCount}`);
      
      // Создаем запись в базе данных
      await bot.prisma.guild.upsert({
        where: { discordId: guild.id },
        update: {
          name: guild.name,
          memberCount: guild.memberCount,
          joinedAt: new Date(),
        },
        create: {
          discordId: guild.id,
          name: guild.name,
          memberCount: guild.memberCount || 0,
          ownerId: guild.ownerId,
          joinedAt: new Date(),
        },
      });
      
      // Логирование события
      await bot.logAction({
        type: 'guild',
        message: `Bot joined guild: ${guild.name}`,
        guildId: guild.id,
        userId: bot.client.user!.id,
        data: {
          guildName: guild.name,
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
        },
      });
      
      // Отправка приветственного сообщения (если есть системный канал)
      if (guild.systemChannel) {
        const welcomeEmbed = {
          color: 0x00FF00,
          title: '🎉 Спасибо за добавление бота!',
          description: 'Этот бот поможет вам управлять сервером через веб-панель.',
          fields: [
            {
              name: '🌐 Веб-панель',
              value: 'http://localhost:3000',
              inline: true,
            },
            {
              name: '📚 Команды',
              value: 'Используйте `/help` для списка команд',
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };
        
        await guild.systemChannel.send({ embeds: [welcomeEmbed] }).catch(() => {
          logger.warn(`Не удалось отправить приветственное сообщение в ${guild.name}`);
        });
      }
    } catch (error) {
      logger.error('Error in guildCreate event:', error);
    }
  },
}; 