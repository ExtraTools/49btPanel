import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './utils/logger';
import { EventHandler } from './handlers/EventHandler';
import { CommandHandler } from './handlers/CommandHandler';
import { ModalHandler } from './handlers/ModalHandler';
import { ButtonHandler } from './handlers/ButtonHandler';
import { AutoModHandler } from './handlers/AutoModHandler';
import { AnalyticsService } from './services/AnalyticsService';
import { CacheService } from './services/CacheService';
import { TicketService } from './services/TicketService';
import type { Command, BotEvent, ButtonHandler as ButtonHandlerType, ModalHandler as ModalHandlerType } from './types';

// Load environment variables
config();

export class DiscordBot {
  public client: Client;
  public prisma: PrismaClient;
  public cache: CacheService;
  public analytics: AnalyticsService;
  public ticketService: TicketService;
  public commands: Collection<string, Command> = new Collection();
  public events: Collection<string, BotEvent> = new Collection();
  
  // Handlers
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private buttonHandler: ButtonHandler;
  private modalHandler: ModalHandler;
  private autoModHandler: AutoModHandler;

  constructor() {
    // Initialize Discord client with intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
      ],
      allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
      },
    });

    // Initialize database
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });

    // Initialize collections
    this.commands = new Collection();
    this.events = new Collection();

    // Initialize services
    this.analytics = new AnalyticsService(this);
    this.cache = new CacheService();
    this.ticketService = new TicketService(this);

    // Initialize handlers
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    this.buttonHandler = new ButtonHandler(this);
    this.modalHandler = new ModalHandler(this);
    this.autoModHandler = new AutoModHandler(this);
  }

  /**
   * Initialize and start the bot
   */
  async start(): Promise<void> {
    try {
      logger.info('🤖 Starting Discord Bot...');

      // Connect to database
      await this.connectDatabase();

      // Initialize services
      await this.initializeServices();

      // Load handlers
      await this.loadHandlers();

      // Login to Discord
      await this.client.login(process.env.DISCORD_BOT_TOKEN);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Discord Bot started successfully');
    } catch (error) {
      logger.error('❌ Failed to start Discord Bot:', error);
      process.exit(1);
    }
  }

  /**
   * Connect to database
   */
  private async connectDatabase(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('✅ Database connected');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    try {
      logger.info('🔄 Initializing services...');
      
      await this.analytics.initialize();
      logger.info('✅ Analytics Service initialized');
      
      await this.autoModHandler.initialize();
      logger.info('✅ AutoMod Handler initialized');
      
      logger.info('✅ All services initialized successfully');
    } catch (error) {
      logger.error('❌ Services initialization failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Load all handlers
   */
  private async loadHandlers(): Promise<void> {
    try {
      await this.eventHandler.loadEvents();
      await this.commandHandler.loadCommands();
      await this.buttonHandler.loadButtons();
      await this.modalHandler.loadModals();
      logger.info('✅ Handlers loaded');
    } catch (error) {
      logger.error('❌ Handlers loading failed:', error);
      throw error;
    }
  }

  /**
   * Get guild settings with caching
   */
  async getGuildSettings(guildId: string): Promise<any | null> {
    try {
      const cacheKey = `guild_settings:${guildId}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const settings = await this.prisma.guildSettings.findUnique({
        where: { guildId }
      });

      if (settings) {
        await this.cache.set(cacheKey, settings, 300); // 5 minutes cache
      }

      return settings;
    } catch (error) {
      logger.error('Error getting guild settings:', error);
      return null;
    }
  }

  /**
   * Log action to database and analytics
   */
  async logAction(action: {
    type: string;
    message: string;
    guildId: string;
    userId: string;
    data?: any;
  }): Promise<void> {
    try {
      // Log to database
      await this.prisma.log.create({
        data: {
          type: action.type,
          level: 'info',
          message: action.message,
          guildId: action.guildId,
          userId: action.userId,
          data: action.data ? JSON.stringify(action.data) : null,
        }
      });

      // Track in analytics
      await this.analytics.trackEvent({
        type: action.type,
        event: 'action_logged',
        userId: action.userId,
        guildId: action.guildId,
        data: action.data || {}
      });
    } catch (error) {
      logger.error('Error logging action:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        action
      });
    }
  }

  /**
   * Get bot statistics
   */
  getStats(): any {
    return {
      guilds: this.client.guilds.cache.size,
      users: this.client.users.cache.size,
      channels: this.client.channels.cache.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      commands: this.commandHandler.getCommandStats(),
      events: this.eventHandler.getEventStats(),
      buttons: this.buttonHandler.getButtonStats(),
      modals: this.modalHandler.getModalStats(),
      automod: this.autoModHandler.getAutoModStats(),
      cache: this.cache.getStats()
    };
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Disconnect from Discord
        this.client.destroy();
        
        // Disconnect from database
        await this.prisma.$disconnect();
        
        // Clear cache
        await this.cache.clear();
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  const bot = new DiscordBot();
  bot.start();
}

export default DiscordBot; 