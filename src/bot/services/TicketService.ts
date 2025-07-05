import { 
  Guild, 
  GuildMember, 
  TextChannel, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';

export interface TicketCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: number;
  mentionRoles: string[];
  questions: string[];
}

export interface TicketConfig {
  enabled: boolean;
  categories: TicketCategory[];
  supportRole: string;
  moderatorRole: string;
  logChannel: string;
  transcriptChannel: string;
  maxTicketsPerUser: number;
  autoCloseAfterHours: number;
  dmUserOnClose: boolean;
  categoryChannel: string;
}

export class TicketService {
  private bot: DiscordBot;
  private defaultConfig: TicketConfig = {
    enabled: true,
    categories: [
      {
        id: 'general',
        name: 'Общие вопросы',
        emoji: '❓',
        description: 'Общие вопросы и помощь',
        color: 0x3498db,
        mentionRoles: [],
        questions: ['Опишите вашу проблему', 'Когда возникла проблема?']
      },
      {
        id: 'report',
        name: 'Жалоба',
        emoji: '🚨',
        description: 'Сообщить о нарушении',
        color: 0xe74c3c,
        mentionRoles: [],
        questions: ['На кого жалуетесь?', 'Что произошло?', 'Есть ли доказательства?']
      },
      {
        id: 'appeal',
        name: 'Апелляция',
        emoji: '⚖️',
        description: 'Обжалование наказания',
        color: 0xf39c12,
        mentionRoles: [],
        questions: ['Какое наказание обжалуете?', 'Почему считаете наказание несправедливым?']
      }
    ],
    supportRole: '',
    moderatorRole: '',
    logChannel: '',
    transcriptChannel: '',
    maxTicketsPerUser: 3,
    autoCloseAfterHours: 72,
    dmUserOnClose: true,
    categoryChannel: ''
  };

  constructor(bot: DiscordBot) {
    this.bot = bot;
  }

  /**
   * Create ticket panel in specified channel
   */
  async createTicketPanel(guild: Guild, channelId: string): Promise<boolean> {
    try {
      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        logger.error(`Ticket panel channel not found: ${channelId}`);
        return false;
      }

      const config = await this.getTicketConfig(guild.id);
      if (!config.enabled) {
        logger.warn(`Tickets disabled for guild: ${guild.id}`);
        return false;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Система поддержки')
        .setDescription(
          'Выберите категорию для создания тикета.\n' +
          'Наша команда поддержки поможет вам с любыми вопросами!'
        )
        .setColor(0x5865f2)
        .addFields(
          config.categories.map(cat => ({
            name: `${cat.emoji} ${cat.name}`,
            value: cat.description,
            inline: true
          }))
        )
        .setFooter({ text: 'Нажмите на кнопку для создания тикета' })
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>();
      
      for (const category of config.categories.slice(0, 5)) { // Max 5 buttons per row
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_create_${category.id}`)
            .setLabel(category.name)
            .setEmoji(category.emoji)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      await channel.send({
        embeds: [embed],
        components: [buttons]
      });

      logger.info(`Ticket panel created in ${guild.name} (${channel.name})`);
      return true;
    } catch (error) {
      logger.error('Error creating ticket panel:', error);
      return false;
    }
  }

  /**
   * Create new ticket
   */
  async createTicket(
    guild: Guild,
    member: GuildMember,
    categoryId: string,
    answers?: string[]
  ): Promise<{ success: boolean; ticket?: any; error?: string }> {
    try {
      const config = await this.getTicketConfig(guild.id);
      const category = config.categories.find(cat => cat.id === categoryId);
      
      if (!category) {
        return { success: false, error: 'Категория не найдена' };
      }

      // Check if user has too many open tickets
      const openTickets = await this.bot.prisma.ticket.count({
        where: {
          userId: member.id,
          guildId: guild.id,
          status: 'open'
        }
      });

      if (openTickets >= config.maxTicketsPerUser) {
        return { 
          success: false, 
          error: `У вас уже есть ${openTickets} открытых тикетов. Максимум: ${config.maxTicketsPerUser}` 
        };
      }

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${member.user.username}-${Date.now().toString().slice(-4)}`,
        type: ChannelType.GuildText,
        parent: config.categoryChannel || undefined,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ]
      });

      // Add support/moderator roles permissions
      if (config.supportRole) {
        await ticketChannel.permissionOverwrites.create(config.supportRole, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          ManageMessages: true
        });
      }

      if (config.moderatorRole) {
        await ticketChannel.permissionOverwrites.create(config.moderatorRole, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          ManageMessages: true
        });
      }

      // Create ticket in database
      const ticket = await this.bot.prisma.ticket.create({
        data: {
          userId: member.id,
          guildId: guild.id,
          channelId: ticketChannel.id,
          category: categoryId,
          priority: 'medium',
          status: 'open',
          createdAt: new Date(),
        }
      });

      // Save answers if provided
      if (answers && answers.length > 0) {
        for (let i = 0; i < answers.length; i++) {
          if (answers[i] && category.questions[i]) {
            await this.bot.prisma.ticketMessage.create({
              data: {
                ticketId: ticket.id,
                userId: member.id,
                content: `**${category.questions[i]}**\n${answers[i]}`,
                messageType: 'system',
                createdAt: new Date()
              }
            });
          }
        }
      }

      // Create welcome embed
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(
          `Привет, ${member}!\n\n` +
          `Ваш тикет был создан. Наша команда поддержки свяжется с вами в ближайшее время.\n\n` +
          `**ID Тикета:** \`${ticket.id}\`\n` +
          `**Категория:** ${category.name}\n` +
          `**Статус:** Открыт`
        )
        .setColor(category.color)
        .setFooter({ text: 'Используйте кнопки ниже для управления тикетом' })
        .setTimestamp();

      // Create action buttons
      const actionButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_close_${ticket.id}`)
            .setLabel('Закрыть тикет')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticket.id}`)
            .setLabel('Взять в работу')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`ticket_priority_${ticket.id}`)
            .setLabel('Приоритет')
            .setEmoji('⚡')
            .setStyle(ButtonStyle.Secondary)
        );

      await ticketChannel.send({
        embeds: [welcomeEmbed],
        components: [actionButtons]
      });

      // Show user's answers if any
      if (answers && answers.length > 0) {
        const answersEmbed = new EmbedBuilder()
          .setTitle('📋 Ваши ответы')
          .setColor(0x95a5a6)
          .setTimestamp();

        for (let i = 0; i < answers.length; i++) {
          if (answers[i] && category.questions[i]) {
            answersEmbed.addFields({
              name: category.questions[i],
              value: answers[i],
              inline: false
            });
          }
        }

        await ticketChannel.send({ embeds: [answersEmbed] });
      }

      // Mention support roles
      const mentions = category.mentionRoles
        .map(roleId => `<@&${roleId}>`)
        .join(' ');
      
      if (mentions) {
        await ticketChannel.send({
          content: `${mentions} - новый тикет от ${member}`,
          allowedMentions: { roles: category.mentionRoles }
        });
      }

      // Log ticket creation
      await this.logTicketAction(guild, ticket, member, 'created');

      // Track analytics
      await this.bot.analytics.trackTicket(ticket.id, member.id, guild.id, 'created');

      logger.info(`Ticket created: ${ticket.id} by ${member.user.tag} in ${guild.name}`);

      return { success: true, ticket };
    } catch (error) {
      logger.error('Error creating ticket:', error);
      return { success: false, error: 'Ошибка при создании тикета' };
    }
  }

  /**
   * Close ticket
   */
  async closeTicket(
    guild: Guild,
    ticketId: string,
    closedBy: GuildMember,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ticket = await this.bot.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!ticket) {
        return { success: false, error: 'Тикет не найден' };
      }

      if (ticket.status === 'closed') {
        return { success: false, error: 'Тикет уже закрыт' };
      }

      const channel = guild.channels.cache.get(ticket.channelId) as TextChannel;
      if (!channel) {
        return { success: false, error: 'Канал тикета не найден' };
      }

      // Create transcript
      const transcript = await this.createTranscript(ticket);

      // Update ticket in database
      await this.bot.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'closed',
          closedBy: closedBy.id,
          closedAt: new Date(),
          closeReason: reason || 'Тикет закрыт'
        }
      });

      // Send closing message
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Тикет закрыт')
        .setDescription(
          `Тикет был закрыт пользователем ${closedBy}\n\n` +
          `**Причина:** ${reason || 'Не указана'}\n` +
          `**Время работы:** ${this.getTicketDuration(ticket.createdAt)}`
        )
        .setColor(0xe74c3c)
        .setTimestamp();

      await channel.send({ embeds: [closeEmbed] });

      // Send transcript to log channel
      const config = await this.getTicketConfig(guild.id);
      if (config.transcriptChannel) {
        const transcriptChannel = guild.channels.cache.get(config.transcriptChannel) as TextChannel;
        if (transcriptChannel) {
          await transcriptChannel.send({
            content: `📄 Транскрипт тикета \`${ticket.id}\``,
            files: [{
              attachment: Buffer.from(transcript, 'utf8'),
              name: `ticket-${ticket.id}-transcript.txt`
            }]
          });
        }
      }

      // DM user if enabled
      if (config.dmUserOnClose) {
        try {
          const user = await this.bot.client.users.fetch(ticket.userId);
          const dmEmbed = new EmbedBuilder()
            .setTitle('🔒 Ваш тикет закрыт')
            .setDescription(
              `Ваш тикет \`${ticket.id}\` в сервере **${guild.name}** был закрыт.\n\n` +
              `**Причина:** ${reason || 'Не указана'}\n` +
              `**Закрыт:** ${closedBy.user.tag}`
            )
            .setColor(0xe74c3c)
            .setTimestamp();

          await user.send({ embeds: [dmEmbed] });
        } catch (error) {
          logger.warn('Could not DM user about ticket closure:', error);
        }
      }

      // Delete channel after delay
      setTimeout(async () => {
        try {
          await channel.delete('Тикет закрыт');
        } catch (error) {
          logger.error('Error deleting ticket channel:', error);
        }
      }, 10000); // 10 seconds delay

      // Log ticket closure
      await this.logTicketAction(guild, ticket, closedBy, 'closed', reason);

      // Track analytics
      await this.bot.analytics.trackTicket(ticket.id, closedBy.id, guild.id, 'closed');

      logger.info(`Ticket closed: ${ticket.id} by ${closedBy.user.tag} in ${guild.name}`);

      return { success: true };
    } catch (error) {
      logger.error('Error closing ticket:', error);
      return { success: false, error: 'Ошибка при закрытии тикета' };
    }
  }

  /**
   * Claim ticket
   */
  async claimTicket(
    guild: Guild,
    ticketId: string,
    claimedBy: GuildMember
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ticket = await this.bot.prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return { success: false, error: 'Тикет не найден' };
      }

      if (ticket.assignedTo) {
        return { success: false, error: 'Тикет уже взят в работу' };
      }

      // Update ticket
      await this.bot.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedTo: claimedBy.id,
          status: 'in_progress'
        }
      });

      const channel = guild.channels.cache.get(ticket.channelId) as TextChannel;
      if (channel) {
        const claimEmbed = new EmbedBuilder()
          .setTitle('👤 Тикет взят в работу')
          .setDescription(`${claimedBy} взял этот тикет в работу`)
          .setColor(0xf39c12)
          .setTimestamp();

        await channel.send({ embeds: [claimEmbed] });
      }

      // Log ticket claim
      await this.logTicketAction(guild, ticket, claimedBy, 'claimed');

      return { success: true };
    } catch (error) {
      logger.error('Error claiming ticket:', error);
      return { success: false, error: 'Ошибка при взятии тикета в работу' };
    }
  }

  /**
   * Get ticket configuration
   */
  private async getTicketConfig(guildId: string): Promise<TicketConfig> {
    try {
      const settings = await this.bot.prisma.guildSettings.findUnique({
        where: { guildId },
        select: { ticketConfig: true }
      });

      if (settings?.ticketConfig) {
        return { ...this.defaultConfig, ...settings.ticketConfig as any };
      }

      return this.defaultConfig;
    } catch (error) {
      logger.error('Error getting ticket config:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Create transcript
   */
  private async createTranscript(ticket: any): Promise<string> {
    let transcript = `=== ТРАНСКРИПТ ТИКЕТА ===\n`;
    transcript += `ID: ${ticket.id}\n`;
    transcript += `Пользователь: ${ticket.userId}\n`;
    transcript += `Создан: ${ticket.createdAt.toLocaleString('ru-RU')}\n`;
    transcript += `Закрыт: ${ticket.closedAt?.toLocaleString('ru-RU') || 'Открыт'}\n`;
    transcript += `Категория: ${ticket.category}\n`;
    transcript += `Статус: ${ticket.status}\n`;
    transcript += `\n=== СООБЩЕНИЯ ===\n\n`;

    if (ticket.messages && ticket.messages.length > 0) {
      for (const message of ticket.messages) {
        transcript += `[${message.createdAt.toLocaleString('ru-RU')}] ${message.userId}: ${message.content}\n`;
      }
    }

    return transcript;
  }

  /**
   * Get ticket duration
   */
  private getTicketDuration(createdAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}ч ${diffMinutes}м`;
    }
    return `${diffMinutes}м`;
  }

  /**
   * Log ticket action
   */
  private async logTicketAction(
    guild: Guild,
    ticket: any,
    user: GuildMember,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.bot.logAction({
        type: 'ticket',
        message: `Ticket ${action}: ${ticket.id}`,
        guildId: guild.id,
        userId: user.id,
        data: {
          ticketId: ticket.id,
          action,
          reason,
          category: ticket.category
        }
      });
    } catch (error) {
      logger.error('Error logging ticket action:', error);
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(guildId: string): Promise<any> {
    try {
      const stats = await this.bot.prisma.ticket.groupBy({
        by: ['status'],
        where: { guildId },
        _count: true
      });

      const totalTickets = await this.bot.prisma.ticket.count({
        where: { guildId }
      });

      const averageResponseTime = await this.bot.prisma.ticket.aggregate({
        where: { 
          guildId,
          status: 'closed',
          closedAt: { not: null }
        },
        _avg: {
          // This would need a calculated field for response time
        }
      });

      return {
        totalTickets,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        averageResponseTime: '2h 30m' // Placeholder
      };
    } catch (error) {
      logger.error('Error getting ticket stats:', error);
      return {
        totalTickets: 0,
        byStatus: {},
        averageResponseTime: 'N/A'
      };
    }
  }
} 