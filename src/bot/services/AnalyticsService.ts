import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { AnalyticsEvent } from '../types';

export class AnalyticsService {
  private bot: DiscordBot;
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  // In-memory counters for quick stats
  private counters: Map<string, number> = new Map();
  private dailyStats: Map<string, Map<string, number>> = new Map();
  private initialized: boolean = false;

  constructor(bot: DiscordBot) {
    this.bot = bot;
  }

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔄 Initializing Analytics Service...');
      
      // Load daily stats from cache
      await this.loadDailyStats();
      
      // Start flush timer
      this.startFlushTimer();
      
      this.initialized = true;
      logger.info('✅ Analytics Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Analytics Service:', error);
      throw error;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private async loadDailyStats(): Promise<void> {
    // Load today's stats from cache if available
    const today = new Date().toISOString().split('T')[0];
    await this.getDailyStatsFromCache(today);
  }

  private async getDailyStatsFromCache(date: string): Promise<void> {
    try {
      const cached = await this.bot.cache.get(`analytics:daily:${date}`);
      if (cached) {
        this.dailyStats.set(date, new Map(Object.entries(cached)));
        logger.debug(`✅ Loaded daily stats for ${date} from cache`);
      } else {
        logger.debug(`ℹ️  No cached daily stats found for ${date}`);
      }
    } catch (error) {
      logger.error(`Failed to load daily stats from cache for ${date}:`, {
        error: error.message,
        stack: error.stack,
        date
      });
    }
  }

  private async saveDailyStatsToCache(date: string): Promise<void> {
    try {
      const stats = this.dailyStats.get(date);
      if (stats) {
        const statsObject = Object.fromEntries(stats);
        await this.bot.cache.set(`analytics:daily:${date}`, statsObject, 86400); // 24 hours
      }
    } catch (error) {
      logger.error('Failed to save daily stats to cache:', error);
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(fullEvent);

    // Update in-memory counters
    this.updateCounters(fullEvent);

    // Update daily stats
    this.updateDailyStats(fullEvent);

    // Flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  private updateCounters(event: AnalyticsEvent): void {
    // Global counters
    this.incrementCounter(`total:${event.type}`);
    this.incrementCounter(`total:${event.type}:${event.event}`);

    // Guild-specific counters
    if (event.guildId) {
      this.incrementCounter(`guild:${event.guildId}:${event.type}`);
      this.incrementCounter(`guild:${event.guildId}:${event.type}:${event.event}`);
    }

    // User-specific counters
    if (event.userId) {
      this.incrementCounter(`user:${event.userId}:${event.type}`);
      this.incrementCounter(`user:${event.userId}:${event.type}:${event.event}`);
    }
  }

  private updateDailyStats(event: AnalyticsEvent): void {
    const date = event.timestamp.toISOString().split('T')[0];
    
    if (!this.dailyStats.has(date)) {
      this.dailyStats.set(date, new Map());
    }

    const dayStats = this.dailyStats.get(date)!;
    
    // Track various metrics
    const keys = [
      `${event.type}:${event.event}`,
      `total:${event.type}`,
      'total:events',
    ];

    if (event.guildId) {
      keys.push(`guild:${event.guildId}:${event.type}`);
    }

    if (event.userId) {
      keys.push(`user:${event.userId}:${event.type}`);
    }

    keys.forEach(key => {
      dayStats.set(key, (dayStats.get(key) || 0) + 1);
    });

    // Save to cache periodically
    if (Math.random() < 0.1) { // 10% chance to save
      this.saveDailyStatsToCache(date);
    }
  }

  private incrementCounter(key: string): void {
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  /**
   * Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Batch insert to database
      await this.bot.prisma.analytics.createMany({
        data: events.map(event => ({
          type: event.type,
          event: event.event,
          guildId: event.guildId,
          data: event.data,
          createdAt: event.timestamp,
        })),
      });

      logger.debug(`📊 Flushed ${events.length} analytics events to database`);
    } catch (error) {
      logger.error('Failed to flush analytics events:', error);
      
      // Re-add events to queue if flush failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Track command usage
   */
  async trackCommand(commandName: string, userId: string, guildId?: string, success: boolean = true): Promise<void> {
    await this.trackEvent({
      type: 'command',
      event: success ? 'executed' : 'failed',
      guildId,
      userId,
      data: {
        command: commandName,
        success,
      },
    });

    logger.command(commandName, userId, guildId);
  }

  /**
   * Track interaction usage
   */
  async trackInteraction(type: string, customId: string, userId: string, guildId?: string): Promise<void> {
    await this.trackEvent({
      type: 'interaction',
      event: type,
      guildId,
      userId,
      data: {
        customId,
      },
    });
  }

  /**
   * Track moderation action
   */
  async trackModeration(action: string, moderatorId: string, targetId: string, guildId: string, reason?: string): Promise<void> {
    await this.trackEvent({
      type: 'moderation',
      event: action,
      guildId,
      userId: moderatorId,
      data: {
        targetId,
        reason,
      },
    });

    logger.moderation(action, moderatorId, targetId, guildId, reason);
  }

  /**
   * Track automod action
   */
  async trackAutoMod(rule: string, userId: string, guildId: string, action: string): Promise<void> {
    await this.trackEvent({
      type: 'automod',
      event: action,
      guildId,
      userId,
      data: {
        rule,
      },
    });

    logger.automod(rule, userId, guildId, action);
  }

  /**
   * Track user activity
   */
  async trackUserActivity(activity: string, userId: string, guildId?: string, data?: any): Promise<void> {
    await this.trackEvent({
      type: 'user_activity',
      event: activity,
      guildId,
      userId,
      data: data || {},
    });
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(guildId?: string, days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    try {
      const analytics = await this.bot.prisma.analytics.findMany({
        where: {
          ...(guildId && { guildId }),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Process data
      const summary = {
        totalEvents: analytics.length,
        commandUsage: {} as Record<string, number>,
        moderationActions: {} as Record<string, number>,
        autoModTriggers: {} as Record<string, number>,
        userActivity: {} as Record<string, number>,
        dailyBreakdown: {} as Record<string, number>,
        topUsers: {} as Record<string, number>,
        topGuilds: {} as Record<string, number>,
      };

      analytics.forEach(event => {
        const date = event.createdAt.toISOString().split('T')[0];
        
        // Daily breakdown
        summary.dailyBreakdown[date] = (summary.dailyBreakdown[date] || 0) + 1;

        // Type-specific summaries
        switch (event.type) {
          case 'command':
            const command = event.data?.command || 'unknown';
            summary.commandUsage[command] = (summary.commandUsage[command] || 0) + 1;
            break;
          
          case 'moderation':
            summary.moderationActions[event.event] = (summary.moderationActions[event.event] || 0) + 1;
            break;
          
          case 'automod':
            const rule = event.data?.rule || event.event;
            summary.autoModTriggers[rule] = (summary.autoModTriggers[rule] || 0) + 1;
            break;
          
          case 'user_activity':
            summary.userActivity[event.event] = (summary.userActivity[event.event] || 0) + 1;
            break;
        }

        // Top guilds (if not filtering by guild)
        if (!guildId && event.guildId) {
          summary.topGuilds[event.guildId] = (summary.topGuilds[event.guildId] || 0) + 1;
        }
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get analytics summary:', error);
      return null;
    }
  }

  /**
   * Get real-time stats
   */
  getRealTimeStats(): any {
    return {
      counters: Object.fromEntries(this.counters),
      queueSize: this.eventQueue.length,
      dailyStats: Object.fromEntries(
        Array.from(this.dailyStats.entries()).map(([date, stats]) => [
          date,
          Object.fromEntries(stats),
        ])
      ),
    };
  }

  /**
   * Get command statistics
   */
  async getCommandStats(guildId?: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const commandStats = await this.bot.prisma.analytics.findMany({
        where: {
          type: 'command',
          ...(guildId && { guildId }),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          event: true,
          data: true,
          createdAt: true,
        },
      });

      const stats = {
        totalCommands: commandStats.length,
        successfulCommands: commandStats.filter(s => s.event === 'executed').length,
        failedCommands: commandStats.filter(s => s.event === 'failed').length,
        commandBreakdown: {} as Record<string, { success: number; failed: number }>,
        hourlyUsage: Array(24).fill(0),
        dailyUsage: {} as Record<string, number>,
      };

      commandStats.forEach(stat => {
        const command = stat.data?.command || 'unknown';
        const isSuccess = stat.event === 'executed';
        const hour = stat.createdAt.getHours();
        const date = stat.createdAt.toISOString().split('T')[0];

        // Command breakdown
        if (!stats.commandBreakdown[command]) {
          stats.commandBreakdown[command] = { success: 0, failed: 0 };
        }
        
        if (isSuccess) {
          stats.commandBreakdown[command].success++;
        } else {
          stats.commandBreakdown[command].failed++;
        }

        // Hourly usage
        stats.hourlyUsage[hour]++;

        // Daily usage
        stats.dailyUsage[date] = (stats.dailyUsage[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get command stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old analytics data
   */
  async cleanup(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
      
      const deleted = await this.bot.prisma.analytics.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`🧹 Cleaned up ${deleted.count} old analytics records`);
    } catch (error) {
      logger.error('Failed to cleanup analytics data:', error);
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush remaining events
    await this.flushEvents();

    // Save daily stats
    const today = new Date().toISOString().split('T')[0];
    await this.saveDailyStatsToCache(today);

    logger.info('📊 Analytics service shutdown complete');
  }
} 