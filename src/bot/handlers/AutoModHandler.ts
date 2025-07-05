import { Events, Message } from 'discord.js';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { AutoModRule } from '../types';

export class AutoModHandler {
  private bot: DiscordBot;
  private openai?: OpenAI;
  private rules: Map<string, AutoModRule[]> = new Map();
  private userMessageCount: Map<string, { count: number; lastReset: number }> = new Map();

  constructor(bot: DiscordBot) {
    this.bot = bot;
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('✅ OpenAI initialized for AI moderation');
    } else {
      logger.warn('⚠️ OpenAI API key not found, AI moderation disabled');
    }
    
    // Register message handler
    this.bot.client.on(Events.MessageCreate, this.handleMessage.bind(this));
  }

  /**
   * Initialize auto moderation
   */
  async initialize(): Promise<void> {
    try {
      await this.loadRules();
      logger.info('✅ Auto moderation initialized');
    } catch (error) {
      logger.error('Failed to initialize auto moderation:', error);
    }
  }

  /**
   * Load auto moderation rules from database
   */
  private async loadRules(): Promise<void> {
    try {
      const dbRules = await this.bot.prisma.autoModRule.findMany({
        where: { enabled: true },
      });

      // Group rules by guild
      this.rules.clear();
      for (const rule of dbRules) {
        if (!this.rules.has(rule.guildId)) {
          this.rules.set(rule.guildId, []);
        }
        
        this.rules.get(rule.guildId)!.push({
          id: rule.id,
          name: rule.name,
          type: rule.type as any,
          enabled: rule.enabled,
          config: rule.config as any,
          actions: {
            deleteMessage: rule.deleteMessage,
            warnUser: rule.warnUser,
            muteUser: rule.muteUser,
            banUser: rule.banUser,
            logAction: true,
            muteDuration: 10, // Default 10 minutes
          },
        });
      }

      logger.info(`Loaded ${dbRules.length} auto moderation rules for ${this.rules.size} guilds`);
    } catch (error) {
      logger.error('Failed to load auto moderation rules:', error);
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: Message): Promise<void> {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    const guildRules = this.rules.get(message.guild.id);
    if (!guildRules || guildRules.length === 0) return;

    try {
      for (const rule of guildRules) {
        const violation = await this.checkRule(message, rule);
        if (violation) {
          await this.handleViolation(message, rule, violation);
          break; // Only trigger one rule per message
        }
      }
    } catch (error) {
      logger.error('Error in auto moderation:', error);
    }
  }

  /**
   * Check if message violates a rule
   */
  private async checkRule(message: Message, rule: AutoModRule): Promise<string | null> {
    const content = message.content.toLowerCase();

    switch (rule.type) {
      case 'spam':
        return this.checkSpam(message, rule);
      
      case 'links':
        return this.checkLinks(message, rule);
      
      case 'caps':
        return this.checkCaps(message, rule);
      
      case 'profanity':
        return this.checkProfanity(message, rule);
      
      case 'mentions':
        return this.checkMentions(message, rule);
      
      case 'duplicates':
        return this.checkDuplicates(message, rule);
      
      default:
        return null;
    }
  }

  /**
   * Check for spam (message frequency)
   */
  private checkSpam(message: Message, rule: AutoModRule): string | null {
    const userId = message.author.id;
    const now = Date.now();
    const timeWindow = (rule.config.timeWindow || 10) * 1000; // Convert to milliseconds
    const maxMessages = rule.config.maxMessages || 5;

    const userData = this.userMessageCount.get(userId);
    
    if (!userData || now - userData.lastReset > timeWindow) {
      this.userMessageCount.set(userId, { count: 1, lastReset: now });
      return null;
    }

    userData.count++;
    
    if (userData.count > maxMessages) {
      return `Spam detected: ${userData.count} messages in ${timeWindow / 1000} seconds`;
    }

    return null;
  }

  /**
   * Check for unwanted links
   */
  private checkLinks(message: Message, rule: AutoModRule): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = message.content.match(urlRegex);
    
    if (!links) return null;

    const allowedDomains = rule.config.allowedDomains || [];
    const blockedDomains = rule.config.blockedDomains || [];

    for (const link of links) {
      try {
        const url = new URL(link);
        const domain = url.hostname.toLowerCase();

        // Check blocked domains
        if (blockedDomains.some((blocked: string) => domain.includes(blocked))) {
          return `Blocked domain detected: ${domain}`;
        }

        // Check allowed domains (if any specified)
        if (allowedDomains.length > 0 && !allowedDomains.some((allowed: string) => domain.includes(allowed))) {
          return `Unauthorized domain: ${domain}`;
        }
      } catch (error) {
        // Invalid URL, might be suspicious
        return `Invalid URL detected: ${link}`;
      }
    }

    return null;
  }

  /**
   * Check for excessive caps
   */
  private checkCaps(message: Message, rule: AutoModRule): string | null {
    const content = message.content;
    const minLength = rule.config.minLength || 10;
    const maxCapsPercentage = rule.config.maxCapsPercentage || 70;

    if (content.length < minLength) return null;

    const capsCount = content.replace(/[^A-Z]/g, '').length;
    const letterCount = content.replace(/[^A-Za-z]/g, '').length;
    
    if (letterCount === 0) return null;

    const capsPercentage = (capsCount / letterCount) * 100;
    
    if (capsPercentage > maxCapsPercentage) {
      return `Excessive caps: ${capsPercentage.toFixed(1)}% (limit: ${maxCapsPercentage}%)`;
    }

    return null;
  }

  /**
   * Check for profanity using AI or word filter
   */
  private async checkProfanity(message: Message, rule: AutoModRule): Promise<string | null> {
    // First check basic word filter
    const blockedWords = rule.config.blockedWords || [];
    const content = message.content.toLowerCase();
    
    for (const word of blockedWords) {
      if (content.includes(word.toLowerCase())) {
        return `Blocked word detected: ${word}`;
      }
    }

    // Use AI for advanced profanity detection
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a content moderator. Analyze the following message and respond with "VIOLATION" if it contains profanity, hate speech, harassment, or inappropriate content. Respond with "CLEAN" if the message is appropriate. Only respond with one word.',
            },
            {
              role: 'user',
              content: message.content,
            },
          ],
          max_tokens: 10,
          temperature: 0,
        });

        const result = response.choices[0]?.message?.content?.trim();
        
        if (result === 'VIOLATION') {
          return 'AI detected inappropriate content';
        }
      } catch (error) {
        logger.error('Error in AI moderation:', error);
      }
    }

    return null;
  }

  /**
   * Check for excessive mentions
   */
  private checkMentions(message: Message, rule: AutoModRule): string | null {
    const maxMentions = rule.config.maxMentions || 5;
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    
    if (mentionCount > maxMentions) {
      return `Excessive mentions: ${mentionCount} (limit: ${maxMentions})`;
    }

    return null;
  }

  /**
   * Check for duplicate messages
   */
  private checkDuplicates(message: Message, rule: AutoModRule): string | null {
    // This would require storing recent messages and comparing
    // For now, return null - can be implemented later
    return null;
  }

  /**
   * Handle rule violation
   */
  private async handleViolation(message: Message, rule: AutoModRule, violation: string): Promise<void> {
    try {
      const actions = rule.actions;
      const guildId = message.guild!.id;
      const userId = message.author.id;

      // Delete message if configured
      if (actions.deleteMessage) {
        await message.delete().catch(() => {});
      }

      // Warn user
      if (actions.warnUser) {
        await this.warnUser(message, rule, violation);
      }

      // Mute user
      if (actions.muteUser) {
        await this.muteUser(message, rule);
      }

      // Ban user (extreme cases)
      if (actions.banUser) {
        await this.banUser(message, rule, violation);
      }

      // Log action
      if (actions.logAction) {
        await this.logViolation(message, rule, violation);
      }

      // Track analytics
      await this.bot.analytics.trackAutoMod(
        rule.name,
        userId,
        guildId,
        'violation_detected'
      );

      logger.warn(`Auto-mod violation: ${rule.name} - ${violation} by ${message.author.tag} in ${message.guild!.name}`);
    } catch (error) {
      logger.error('Error handling auto-mod violation:', error);
    }
  }

  /**
   * Warn user for violation
   */
  private async warnUser(message: Message, rule: AutoModRule, violation: string): Promise<void> {
    try {
      const embed = {
        color: 0xFFA500,
        title: '⚠️ Предупреждение',
        description: `Ваше сообщение нарушило правило: **${rule.name}**\n\nПричина: ${violation}`,
        footer: {
          text: 'Соблюдайте правила сервера',
        },
        timestamp: new Date().toISOString(),
      };

      await message.author.send({ embeds: [embed] }).catch(() => {
        // If DM fails, send in channel
        message.channel.send({
          content: `${message.author}, ваше сообщение нарушило правила.`,
          embeds: [embed],
        }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        }).catch(() => {});
      });
    } catch (error) {
      logger.error('Error warning user:', error);
    }
  }

  /**
   * Mute user for violation
   */
  private async muteUser(message: Message, rule: AutoModRule): Promise<void> {
    try {
      const member = message.member;
      if (!member) return;

      const guild = message.guild!;
      const settings = await this.bot.getGuildSettings(guild.id);
      
      if (settings?.muteRole) {
        await member.roles.add(settings.muteRole);
        
        // Set unmute timer
        const duration = rule.actions.muteDuration || 10;
        setTimeout(async () => {
          try {
            await member.roles.remove(settings.muteRole!);
          } catch (error) {
            logger.error('Error removing mute role:', error);
          }
        }, duration * 60 * 1000);

        logger.info(`Muted user ${member.user.tag} for ${duration} minutes`);
      }
    } catch (error) {
      logger.error('Error muting user:', error);
    }
  }

  /**
   * Ban user for severe violation
   */
  private async banUser(message: Message, rule: AutoModRule, violation: string): Promise<void> {
    try {
      const member = message.member;
      if (!member) return;

      await member.ban({
        reason: `Auto-mod: ${rule.name} - ${violation}`,
        deleteMessageDays: 1,
      });

      logger.warn(`Banned user ${member.user.tag} for auto-mod violation: ${violation}`);
    } catch (error) {
      logger.error('Error banning user:', error);
    }
  }

  /**
   * Log violation to database and log channel
   */
  private async logViolation(message: Message, rule: AutoModRule, violation: string): Promise<void> {
    try {
      await this.bot.logAction({
        type: 'automod',
        message: `Rule violation: ${rule.name}`,
        guildId: message.guild!.id,
        userId: message.author.id,
        data: {
          rule: rule.name,
          violation,
          messageContent: message.content,
          channelId: message.channel.id,
        },
      });
    } catch (error) {
      logger.error('Error logging violation:', error);
    }
  }

  /**
   * Reload rules from database
   */
  async reloadRules(): Promise<void> {
    await this.loadRules();
    logger.info('Auto-moderation rules reloaded');
  }

  /**
   * Get auto-mod statistics
   */
  getAutoModStats(): any {
    const totalRules = Array.from(this.rules.values()).reduce((acc, rules) => acc + rules.length, 0);
    
    return {
      totalRules,
      guildsWithRules: this.rules.size,
      aiEnabled: !!this.openai,
      rulesByGuild: Object.fromEntries(
        Array.from(this.rules.entries()).map(([guildId, rules]) => [
          guildId,
          rules.length,
        ])
      ),
    };
  }
} 