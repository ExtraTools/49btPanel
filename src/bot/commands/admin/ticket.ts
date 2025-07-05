import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types';

export const ticketCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Управление системой тикетов')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Создать панель тикетов')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Канал для размещения панели тикетов')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Закрыть тикет')
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Причина закрытия')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Взять тикет в работу')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unclaim')
        .setDescription('Снять с себя тикет')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Добавить пользователя в тикет')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Пользователь для добавления')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Убрать пользователя из тикета')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Пользователь для удаления')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('transcript')
        .setDescription('Создать транскрипт тикета')
    ),

  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'setup':
        await handleSetup(interaction, bot);
        break;
      case 'close':
        await handleClose(interaction, bot);
        break;
      case 'claim':
        await handleClaim(interaction, bot);
        break;
      case 'unclaim':
        await handleUnclaim(interaction, bot);
        break;
      case 'add':
        await handleAdd(interaction, bot);
        break;
      case 'remove':
        await handleRemove(interaction, bot);
        break;
      case 'transcript':
        await handleTranscript(interaction, bot);
        break;
      default:
        await interaction.reply({
          content: '❌ Неизвестная подкоманда',
          ephemeral: true
        });
    }
  },

  category: 'admin',
  permissions: [PermissionFlagsBits.ManageChannels],
  ownerOnly: false,
  guildOnly: true
};

async function handleSetup(interaction: any, bot: any) {
  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== 0) { // TEXT_CHANNEL
    await interaction.reply({
      content: '❌ Выберите текстовый канал',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const success = await bot.ticketService.createTicketPanel(interaction.guild, channel.id);

  if (success) {
    await interaction.editReply({
      content: `✅ Панель тикетов создана в ${channel}`
    });
  } else {
    await interaction.editReply({
      content: '❌ Ошибка при создании панели тикетов'
    });
  }
}

async function handleClose(interaction: any, bot: any) {
  const reason = interaction.options.getString('reason') || 'Закрыт администратором';

  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id,
      status: { not: 'closed' }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const result = await bot.ticketService.closeTicket(
    interaction.guild,
    ticket.id,
    interaction.member,
    reason
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

async function handleClaim(interaction: any, bot: any) {
  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id,
      status: { not: 'closed' }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const result = await bot.ticketService.claimTicket(
    interaction.guild,
    ticket.id,
    interaction.member
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

async function handleUnclaim(interaction: any, bot: any) {
  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id,
      status: { not: 'closed' }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  if (ticket.assignedTo !== interaction.user.id) {
    await interaction.reply({
      content: '❌ Вы не назначены на этот тикет',
      ephemeral: true
    });
    return;
  }

  try {
    await bot.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedTo: null,
        status: 'open'
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('👤 Тикет освобожден')
      .setDescription(`${interaction.user} снял с себя этот тикет`)
      .setColor(0x95a5a6)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Вы сняли с себя тикет',
      ephemeral: true
    });
  } catch (error) {
    await interaction.reply({
      content: '❌ Ошибка при снятии тикета',
      ephemeral: true
    });
  }
}

async function handleAdd(interaction: any, bot: any) {
  const user = interaction.options.getUser('user');

  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id,
      status: { not: 'closed' }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  try {
    await interaction.channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    const embed = new EmbedBuilder()
      .setTitle('➕ Пользователь добавлен')
      .setDescription(`${user} был добавлен в тикет`)
      .setColor(0x2ecc71)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ ${user} добавлен в тикет`,
      ephemeral: true
    });
  } catch (error) {
    await interaction.reply({
      content: '❌ Ошибка при добавлении пользователя',
      ephemeral: true
    });
  }
}

async function handleRemove(interaction: any, bot: any) {
  const user = interaction.options.getUser('user');

  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id,
      status: { not: 'closed' }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  if (user.id === ticket.userId) {
    await interaction.reply({
      content: '❌ Нельзя убрать создателя тикета',
      ephemeral: true
    });
    return;
  }

  try {
    await interaction.channel.permissionOverwrites.delete(user.id);

    const embed = new EmbedBuilder()
      .setTitle('➖ Пользователь удален')
      .setDescription(`${user} был удален из тикета`)
      .setColor(0xe74c3c)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ ${user} удален из тикета`,
      ephemeral: true
    });
  } catch (error) {
    await interaction.reply({
      content: '❌ Ошибка при удалении пользователя',
      ephemeral: true
    });
  }
}

async function handleTranscript(interaction: any, bot: any) {
  // Check if this is a ticket channel
  const ticket = await bot.prisma.ticket.findFirst({
    where: {
      channelId: interaction.channel.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!ticket) {
    await interaction.reply({
      content: '❌ Эта команда может быть использована только в канале тикета',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Create transcript
    let transcript = `=== ТРАНСКРИПТ ТИКЕТА ===\n`;
    transcript += `ID: ${ticket.id}\n`;
    transcript += `Пользователь: ${ticket.userId}\n`;
    transcript += `Создан: ${ticket.createdAt.toLocaleString('ru-RU')}\n`;
    transcript += `Статус: ${ticket.status}\n`;
    transcript += `Категория: ${ticket.category}\n`;
    transcript += `\n=== СООБЩЕНИЯ ===\n\n`;

    // Get messages from Discord channel
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const sortedMessages = Array.from(messages.values()).reverse();

    for (const message of sortedMessages) {
      if (message.author.bot && message.embeds.length > 0) continue; // Skip bot embeds
      transcript += `[${message.createdAt.toLocaleString('ru-RU')}] ${message.author.tag}: ${message.content}\n`;
      
      if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          transcript += `  📎 ${attachment.name}: ${attachment.url}\n`;
        }
      }
    }

    await interaction.editReply({
      content: '📄 Транскрипт тикета',
      files: [{
        attachment: Buffer.from(transcript, 'utf8'),
        name: `ticket-${ticket.id}-transcript.txt`
      }]
    });
  } catch (error) {
    await interaction.editReply({
      content: '❌ Ошибка при создании транскрипта'
    });
  }
}

export default ticketCommand; 