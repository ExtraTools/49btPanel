import { ModalSubmitInteraction } from 'discord.js';
import type { DiscordBot } from '../index';
import type { ModalHandler } from '../types';

export const ticketModalHandler: ModalHandler = {
  customId: 'ticket_modal',
  async execute(interaction: ModalSubmitInteraction, bot: DiscordBot) {
    const categoryId = interaction.customId.split('_')[2]; // ticket_modal_general

    if (!categoryId) {
      await interaction.reply({
        content: '❌ Некорректная категория тикета',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // Extract answers from modal
    const answers: string[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const answer = interaction.fields.getTextInputValue(`question_${i}`);
        if (answer) {
          answers.push(answer);
        }
      } catch (error) {
        // Field doesn't exist, continue
        break;
      }
    }

    // Create ticket
    const result = await bot.ticketService.createTicket(
      interaction.guild!,
      interaction.member as any,
      categoryId,
      answers
    );

    if (result.success) {
      await interaction.editReply({
        content: `✅ Тикет создан! Перейдите в <#${result.ticket?.channelId}>`
      });
    } else {
      await interaction.editReply({
        content: `❌ ${result.error}`
      });
    }
  }
};

export default ticketModalHandler; 