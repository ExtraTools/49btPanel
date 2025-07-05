import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Client, GatewayIntentBits } from 'discord.js';

export async function GET(request: Request) {
  try {
    // Убираем проверку аутентификации - теперь API доступно без входа

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId') || process.env.DISCORD_GUILD_ID;
    const timeRange = searchParams.get('timeRange') || '30d';
    const type = searchParams.get('type');

    if (!guildId) {
      return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });
    }

    // Вычисляем временные рамки
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Создаем Discord клиент для получения реальных данных
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
      ],
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);

    try {
      const guild = await client.guilds.fetch(guildId);
      
      if (!guild) {
        return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
      }

      // Получаем реальные данные из Discord
      const members = await guild.members.fetch();
      const channels = await guild.channels.fetch();

      // Базовые фильтры для аналитики
      const whereClause: any = {
        guildId,
        createdAt: { gte: startDate }
      };

      if (type) {
        whereClause.type = type;
      }

      // Получаем данные из базы
      const [
        analytics,
        tickets,
        moderationActions,
        logs
      ] = await Promise.all([
        prisma.analytics.findMany({
          where: whereClause,
          select: {
            type: true,
            event: true,
            data: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1000
        }),

        prisma.ticket.findMany({
          where: {
            guildId,
            createdAt: { gte: startDate }
          },
          select: {
            status: true,
            priority: true,
            createdAt: true,
            closedAt: true
          }
        }),

        prisma.moderationAction.findMany({
          where: {
            guildId,
            createdAt: { gte: startDate }
          },
          select: {
            type: true,
            createdAt: true,
            isActive: true
          }
        }),

        prisma.log.findMany({
          where: {
            guildId,
            createdAt: { gte: startDate }
          },
          select: {
            type: true,
            level: true,
            createdAt: true
          },
          take: 500
        })
      ]);

      // Обработка аналитики по типам
      const analyticsByType = analytics.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Активность по дням
      const dailyActivity = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayAnalytics = analytics.filter(a => 
          a.createdAt.toISOString().split('T')[0] === dateStr
        );

        return {
          date: dateStr,
          total: dayAnalytics.length,
          messages: dayAnalytics.filter(a => a.type === 'message_create').length,
          joins: dayAnalytics.filter(a => a.type === 'member_join').length,
          leaves: dayAnalytics.filter(a => a.type === 'member_leave').length
        };
      });

      // Топ каналы по активности
      const channelActivity = analytics
        .filter(a => a.type === 'message_create' && a.data)
        .reduce((acc, item) => {
          try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            const channelId = data?.channelId;
            if (channelId) {
              acc[channelId] = (acc[channelId] || 0) + 1;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга
          }
          return acc;
        }, {} as Record<string, number>);

      const topChannels = Object.entries(channelActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([channelId, count]) => {
          const channel = channels.get(channelId);
          return {
            id: channelId,
            name: channel?.name || 'Неизвестный канал',
            type: channel?.type || 0,
            messageCount: count,
            percentage: Math.round((count / Object.values(channelActivity).reduce((a, b) => a + b, 0)) * 100)
          };
        });

      // Топ пользователи по активности
      const userActivity = analytics
        .filter(a => a.type === 'message_create' && a.data)
        .reduce((acc, item) => {
          try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            const userId = data?.userId;
            if (userId) {
              acc[userId] = (acc[userId] || 0) + 1;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга
          }
          return acc;
        }, {} as Record<string, number>);

      const topUsers = Object.entries(userActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => {
          const member = members.get(userId);
          return {
            id: userId,
            username: member?.user.username || 'Неизвестный пользователь',
            discriminator: member?.user.discriminator || '0000',
            avatar: member?.user.avatar || null,
            messageCount: count,
            isBot: member?.user.bot || false
          };
        })
        .filter(user => !user.isBot); // Исключаем ботов

      // Статистика тикетов
      const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        closed: tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length,
        avgResponseTime: calculateAvgResponseTime(tickets)
      };

      // Статистика модерации
      const moderationStats = {
        total: moderationActions.length,
        warns: moderationActions.filter(a => a.type === 'warn').length,
        kicks: moderationActions.filter(a => a.type === 'kick').length,
        bans: moderationActions.filter(a => a.type === 'ban').length,
        mutes: moderationActions.filter(a => a.type === 'mute').length,
        active: moderationActions.filter(a => a.isActive).length
      };

      // Статистика участников
      const memberStats = {
        total: members.size,
        humans: members.filter(m => !m.user.bot).size,
        bots: members.filter(m => m.user.bot).size,
        online: members.filter(m => 
          m.presence?.status === 'online' || 
          m.presence?.status === 'idle' || 
          m.presence?.status === 'dnd'
        ).size
      };

      // Тренды (сравнение с предыдущим периодом)
      const prevStartDate = new Date();
      prevStartDate.setDate(prevStartDate.getDate() - (days * 2));
      
      const prevAnalytics = await prisma.analytics.count({
        where: {
          guildId,
          createdAt: {
            gte: prevStartDate,
            lt: startDate
          }
        }
      });

      const currentTotal = analytics.length;
      const growthPercentage = prevAnalytics > 0 
        ? ((currentTotal - prevAnalytics) / prevAnalytics) * 100 
        : 0;

      const response = {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        
        overview: {
          totalEvents: analytics.length,
          dailyAverage: Math.round(analytics.length / days),
          growthPercentage: Math.round(growthPercentage * 100) / 100,
          topEventType: Object.entries(analyticsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
        },

        analytics: {
          byType: analyticsByType,
          dailyActivity,
          topChannels,
          topUsers
        },

        statistics: {
          members: memberStats,
          tickets: ticketStats,
          moderation: moderationStats
        },

        trends: {
          messages: calculateTrend(analytics.filter(a => a.type === 'message_create'), days),
          members: calculateTrend(analytics.filter(a => a.type === 'member_join' || a.type === 'member_leave'), days),
          moderation: calculateTrend(moderationActions, days)
        },

        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(response);

    } finally {
      await client.destroy();
    }

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Вспомогательные функции
function calculateAvgResponseTime(tickets: any[]): number {
  const closedTickets = tickets.filter(t => t.closedAt && t.createdAt);
  if (closedTickets.length === 0) return 0;

  const totalTime = closedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt).getTime();
    const closed = new Date(ticket.closedAt).getTime();
    return sum + (closed - created);
  }, 0);

  return Math.round((totalTime / closedTickets.length) / (1000 * 60 * 60)); // в часах
}

function calculateTrend(data: any[], days: number): number {
  const midpoint = Math.floor(days / 2);
  const firstHalf = data.filter(item => {
    const daysAgo = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo >= midpoint;
  }).length;

  const secondHalf = data.filter(item => {
    const daysAgo = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo < midpoint;
  }).length;

  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
} 