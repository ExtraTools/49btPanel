import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Фиктивные данные пользователей
    const users = [
      {
        id: '1',
        username: 'watdin',
        discriminator: '3046',
        globalName: 'Watdin',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
        nickname: 'Главный Админ',
        joinedAt: '2023-01-15T10:00:00Z',
        roles: ['Администратор', 'Участник'],
        status: 'online',
        isBot: false,
        level: 15,
        experience: 12500,
        messages: 2450,
        voiceTime: 1200,
        warnings: 0,
        badges: ['Основатель', 'Разработчик']
      },
      {
        id: '2',
        username: 'ActiveUser',
        discriminator: '1234',
        globalName: 'Active User',
        avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
        nickname: 'Активный Участник',
        joinedAt: '2023-02-20T14:15:00Z',
        roles: ['Активный', 'Участник'],
        status: 'online',
        isBot: false,
        level: 12,
        experience: 9250,
        messages: 1850,
        voiceTime: 780,
        warnings: 0,
        badges: ['Верный', 'Активист']
      }
    ];

    return NextResponse.json({
      success: true,
      data: users,
      stats: {
        total: users.length,
        online: users.filter(u => u.status === 'online').length,
        bots: users.filter(u => u.isBot).length,
        withWarnings: users.filter(u => u.warnings > 0).length
      }
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Здесь будет логика для создания/обновления пользователя
    console.log('User update request:', body);
    
    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
} 