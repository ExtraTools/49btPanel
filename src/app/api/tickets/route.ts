import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Убираем проверку аутентификации - теперь API доступно без входа
    
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId') || process.env.DISCORD_GUILD_ID;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!guildId) {
      return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });
    }

    // Создаем условия фильтрации
    const where: any = { guildId };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Получаем тикеты из базы данных
    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              discriminator: true,
              avatar: true
            }
          },
          messages: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      
      prisma.ticket.count({ where })
    ]);

    // Преобразуем данные для фронтенда
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      number: ticket.number,
      userId: ticket.userId,
      username: ticket.user?.username || 'Неизвестный пользователь',
      discriminator: ticket.user?.discriminator || '0000',
      avatar: ticket.user?.avatar,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      closedAt: ticket.closedAt,
      assignedTo: ticket.assignedTo,
      messageCount: ticket.messages.length,
      lastActivity: ticket.updatedAt,
      channelId: ticket.channelId
    }));

    // Получаем статистику
    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      where: { guildId },
      _count: {
        id: true
      }
    });

    const ticketStats = {
      total: totalCount,
      open: stats.find(s => s.status === 'open')?._count.id || 0,
      in_progress: stats.find(s => s.status === 'in_progress')?._count.id || 0,
      closed: stats.find(s => s.status === 'closed')?._count.id || 0,
      resolved: stats.find(s => s.status === 'resolved')?._count.id || 0
    };

    // Получаем статистику по приоритетам
    const priorityStats = await prisma.ticket.groupBy({
      by: ['priority'],
      where: { guildId },
      _count: {
        id: true
      }
    });

    const priorityBreakdown = {
      low: priorityStats.find(s => s.priority === 'low')?._count.id || 0,
      medium: priorityStats.find(s => s.priority === 'medium')?._count.id || 0,
      high: priorityStats.find(s => s.priority === 'high')?._count.id || 0,
      urgent: priorityStats.find(s => s.priority === 'urgent')?._count.id || 0
    };

    // Получаем активность за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.ticket.findMany({
      where: {
        guildId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Группируем по дням
    const dailyActivity = recentActivity.reduce((acc, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { created: 0, closed: 0 };
      }
      acc[date]!.created++;
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        acc[date]!.closed++;
      }
      return acc;
    }, {} as Record<string, { created: number; closed: number }>);

    // Среднее время ответа
    const closedTickets = await prisma.ticket.findMany({
      where: {
        guildId,
        status: { in: ['closed', 'resolved'] },
        closedAt: { not: null }
      },
      select: {
        createdAt: true,
        closedAt: true
      }
    });

    const responseTimes = closedTickets
      .filter(ticket => ticket.closedAt)
      .map(ticket => {
        const created = new Date(ticket.createdAt).getTime();
        const closed = new Date(ticket.closedAt!).getTime();
        return (closed - created) / (1000 * 60 * 60); // в часах
      });

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const response = {
      tickets: formattedTickets,
      stats: ticketStats,
      priorityBreakdown,
      dailyActivity,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: offset + limit < totalCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Убираем проверку аутентификации - теперь API доступно без входа
    
    const body = await request.json();
    const { guildId, userId, title, description, priority } = body;

    if (!guildId || !userId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Получаем следующий номер тикета для этого гильда
    const lastTicket = await prisma.ticket.findFirst({
      where: { guildId },
      orderBy: { number: 'desc' },
      select: { number: true }
    });

    const nextNumber = (lastTicket?.number || 0) + 1;

    // Создаем тикет
    const ticket = await prisma.ticket.create({
      data: {
        guildId,
        userId,
        number: nextNumber,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            username: true,
            discriminator: true,
            avatar: true
          }
        }
      }
    });

    // Создаем первое сообщение если есть описание
    if (description) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId,
          content: description,
          createdAt: new Date()
        }
      });
    }

    // Логируем создание тикета
    await prisma.log.create({
      data: {
        guildId,
        type: 'ticket_create',
        level: 'info',
        message: `Создан тикет #${nextNumber}: ${title}`,
        data: JSON.stringify({
          ticketId: ticket.id,
          ticketNumber: nextNumber,
          userId,
          title,
          priority: ticket.priority
        }),
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      id: ticket.id,
      number: nextNumber,
      message: 'Тикет создан успешно'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 