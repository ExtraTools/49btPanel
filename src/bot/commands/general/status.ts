import { SlashCommandBuilder } from 'discord.js';
import type { DiscordBot } from '../../index';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Показать статус бота'),
  
  async execute(interaction: any, bot: DiscordBot) {
    try {
      const stats = bot.getStats();
      const uptime = process.uptime();
      const uptimeFormatted = `${Math.floor(uptime / 3600)}ч ${Math.floor((uptime % 3600) / 60)}м ${Math.floor(uptime % 60)}с`;
      
      const embed = {
        color: 0x00FF00,
        title: '🟢 Статус бота',
        fields: [
          {
            name: '⏱️ Время работы',
            value: uptimeFormatted,
            inline: true,
          },
          {
            name: '📊 Серверы',
            value: stats.guilds.toString(),
            inline: true,
          },
          {
            name: '👥 Пользователи',
            value: stats.users.toString(),
            inline: true,
          },
          {
            name: '💾 Память',
            value: `${Math.round(stats.memory.heapUsed / 1024 / 1024)} MB`,
            inline: true,
          },
          {
            name: '🌐 Веб-панель',
            value: '[Открыть панель](http://localhost:3000)',
            inline: true,
          },
          {
            name: '🔄 Версия',
            value: 'v1.0.0',
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in status command:', error);
      await interaction.reply({
        content: '❌ Произошла ошибка при получении статуса.',
        ephemeral: true,
      });
    }
  },
}; 