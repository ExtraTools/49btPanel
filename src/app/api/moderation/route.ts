import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Фиктивные данные модерации
    const moderationActions = [
      {
        id: '1',
        type: 'ban',
        userId: '123456789',
        username: 'BadUser',
        discriminator: '1234',
        moderator: 'AdminBot#0001',
        reason: 'Спам в чате',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        active: true
      },
      {
        id: '2',
        type: 'warn',
        userId: '987654321',
        username: 'NaughtyUser',
        discriminator: '5678',
        moderator: 'AdminBot#0001',
        reason: 'Нарушение правил чата',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        active: true
      },
      {
        id: '3',
        type: 'mute',
        userId: '456789123',
        username: 'LoudUser',
        discriminator: '9012',
        moderator: 'AdminBot#0001',
        reason: 'Флуд в голосовом канале',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        duration: '24h',
        active: true
      }
    ];

    return NextResponse.json({
      success: true,
      data: moderationActions,
      stats: {
        total: moderationActions.length,
        activeBans: moderationActions.filter(a => a.type === 'ban' && a.active).length,
        warnings: moderationActions.filter(a => a.type === 'warn').length,
        activeMutes: moderationActions.filter(a => a.type === 'mute' && a.active).length
      }
    });
  } catch (error) {
    console.error('Moderation API error:', error);
    return NextResponse.json({ error: 'Failed to fetch moderation data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Здесь будет логика для выполнения модерационных действий
    console.log('Moderation action request:', body);
    
    return NextResponse.json({ success: true, message: 'Moderation action executed' });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Failed to execute moderation action' }, { status: 500 });
  }
} 