import { SlashCommandBuilder } from 'discord.js';
import type { DiscordBot } from '../../index';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список доступных команд'),
  
  async execute(interaction: any, bot: DiscordBot) {
    try {
      const commands = Array.from(bot.commands.values());
      const categories = [...new Set(commands.map(cmd => cmd.category || 'Общие'))];
      
      const embed = {
        color: 0x0099FF,
        title: '📚 Список команд',
        description: 'Вот все доступные команды:',
        fields: [] as any[],
        footer: {
          text: 'Используйте / для вызова команд',
        },
        timestamp: new Date().toISOString(),
      };
      
      for (const category of categories) {
        const categoryCommands = commands.filter(cmd => (cmd.category || 'Общие') === category);
        const commandList = categoryCommands.map(cmd => 
          `\`/${cmd.data.name}\` - ${cmd.data.description}`
        ).join('\n');
        
        if (commandList) {
          embed.fields.push({
            name: `📂 ${category}`,
            value: commandList,
            inline: false,
          });
        }
      }
      
      // Добавляем информацию о веб-панели
      embed.fields.push({
        name: '🌐 Веб-панель',
        value: 'Для расширенного управления посетите: http://localhost:3000',
        inline: false,
      });
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      await interaction.reply({
        content: '❌ Произошла ошибка при получении списка команд.',
        ephemeral: true,
      });
    }
  },
}; 