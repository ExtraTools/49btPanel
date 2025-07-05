import { 
  ButtonInteraction, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from 'discord.js';
import type { DiscordBot } from '../index';
import type { ButtonHandler } from '../types';

// Ticket create button handler
export const ticketCreateHandler: ButtonHandler = {
  customId: 'ticket_create',
  async execute(interaction: ButtonInteraction, bot: DiscordBot) {
    const categoryId = interaction.customId.split('_')[2]; // ticket_create_general

    if (!categoryId) {
      await interaction.reply({
        content: '❌ Некорректная категория тикета',
        ephemeral: true
      });
      return;
    }

    // Create modal for questions
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${categoryId}`)
      .setTitle('Создание тикета');

    // Add text inputs for questions (max 5)
    const questions = [
      'Опишите вашу проблему подробно',
      'Когда возникла проблема?',
      'Дополнительная информация (необязательно)'
    ];

    for (let i = 0; i < Math.min(questions.length, 3); i++) {
      const input = new TextInputBuilder()
        .setCustomId(`question_${i}`)
        .setLabel(questions[i])
        .setStyle(i === 0 ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(i < 2)
        .setMaxLength(i === 0 ? 1000 : 500);

      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
      modal.addComponents(actionRow);
    }

    await interaction.showModal(modal);
  }
};

// Ticket close button handler
export const ticketCloseHandler: ButtonHandler = {
  customId: 'ticket_close',
  async execute(interaction: ButtonInteraction, bot: DiscordBot) {
    const ticketId = interaction.customId.split('_')[2]; // ticket_close_123

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Некорректный ID тикета',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const result = await bot.ticketService.closeTicket(
      interaction.guild!,
      ticketId,
      interaction.member as any,
      'Закрыт через кнопку'
    );

    if (result.success) {
      await interaction.editReply({
        content: '✅ Тикет будет закрыт через 10 секунд'
      });
    } else {
      await interaction.editReply({
        content: `❌ ${result.error}`
      });
    }
  }
};

// Ticket claim button handler
export const ticketClaimHandler: ButtonHandler = {
  customId: 'ticket_claim',
  async execute(interaction: ButtonInteraction, bot: DiscordBot) {
    const ticketId = interaction.customId.split('_')[2]; // ticket_claim_123

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Некорректный ID тикета',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const result = await bot.ticketService.claimTicket(
      interaction.guild!,
      ticketId,
      interaction.member as any
    );

    if (result.success) {
      await interaction.editReply({
        content: '✅ Вы взяли тикет в работу'
      });
    } else {
      await interaction.editReply({
        content: `❌ ${result.error}`
      });
    }
  }
};

// Ticket priority button handler
export const ticketPriorityHandler: ButtonHandler = {
  customId: 'ticket_priority',
  async execute(interaction: ButtonInteraction, bot: DiscordBot) {
    const ticketId = interaction.customId.split('_')[2]; // ticket_priority_123

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Некорректный ID тикета',
        ephemeral: true
      });
      return;
    }

    // Create priority selection buttons
    const priorityButtons = new ActionRowBuilder<any>()
      .addComponents(
        {
          type: 2,
          customId: `priority_low_${ticketId}`,
          label: 'Низкий',
          style: 2,
          emoji: '🟢'
        },
        {
          type: 2,
          customId: `priority_medium_${ticketId}`,
          label: 'Средний',
          style: 2,
          emoji: '🟡'
        },
        {
          type: 2,
          customId: `priority_high_${ticketId}`,
          label: 'Высокий',
          style: 2,
          emoji: '🔴'
        },
        {
          type: 2,
          customId: `priority_urgent_${ticketId}`,
          label: 'Срочный',
          style: 4,
          emoji: '🆘'
        }
      );

    await interaction.reply({
      content: 'Выберите приоритет тикета:',
      components: [priorityButtons],
      ephemeral: true
    });
  }
};

// Priority selection handlers
export const priorityHandlers: ButtonHandler[] = [
  {
    customId: 'priority_low',
    async execute(interaction: ButtonInteraction, bot: DiscordBot) {
      await updateTicketPriority(interaction, bot, 'low', '🟢 Низкий');
    }
  },
  {
    customId: 'priority_medium',
    async execute(interaction: ButtonInteraction, bot: DiscordBot) {
      await updateTicketPriority(interaction, bot, 'medium', '🟡 Средний');
    }
  },
  {
    customId: 'priority_high',
    async execute(interaction: ButtonInteraction, bot: DiscordBot) {
      await updateTicketPriority(interaction, bot, 'high', '🔴 Высокий');
    }
  },
  {
    customId: 'priority_urgent',
    async execute(interaction: ButtonInteraction, bot: DiscordBot) {
      await updateTicketPriority(interaction, bot, 'urgent', '🆘 Срочный');
    }
  }
];

async function updateTicketPriority(
  interaction: ButtonInteraction,
  bot: DiscordBot,
  priority: string,
  label: string
) {
  const ticketId = interaction.customId.split('_')[2];

  try {
    await bot.prisma.ticket.update({
      where: { id: ticketId },
      data: { priority }
    });

    const embed = new EmbedBuilder()
      .setTitle('⚡ Приоритет изменен')
      .setDescription(`Приоритет тикета изменен на: ${label}`)
      .setColor(0xf39c12)
      .setTimestamp();

    await interaction.channel?.send({ embeds: [embed] });

    await interaction.update({
      content: `✅ Приоритет изменен на: ${label}`,
      components: []
    });
  } catch (error) {
    await interaction.update({
      content: '❌ Ошибка при изменении приоритета',
      components: []
    });
  }
}

export default [
  ticketCreateHandler,
  ticketCloseHandler,
  ticketClaimHandler,
  ticketPriorityHandler,
  ...priorityHandlers
]; 