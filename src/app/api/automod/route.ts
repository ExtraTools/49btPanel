import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Фиктивные данные автомода
    const automodRules = [
      {
        id: '1',
        name: 'Фильтр нецензурной лексики',
        description: 'Блокирует сообщения с матом и оскорблениями',
        enabled: true,
        type: 'word_filter',
        severity: 'high',
        action: 'delete',
        triggeredCount: 47,
        lastTriggered: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        name: 'Антиспам',
        description: 'Предотвращает спам одинаковыми сообщениями',
        enabled: true,
        type: 'spam_filter',
        severity: 'medium',
        action: 'mute',
        triggeredCount: 23,
        lastTriggered: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '3',
        name: 'Фильтр CAPS',
        description: 'Предупреждает за сообщения в верхнем регистре',
        enabled: true,
        type: 'caps_filter',
        severity: 'low',
        action: 'warn',
        triggeredCount: 156,
        lastTriggered: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: automodRules,
      settings: {
        enabled: true,
        logChannel: '#automod-logs',
        muteDuration: 600,
        maxWarnings: 3
      },
      stats: {
        totalRules: automodRules.length,
        activeRules: automodRules.filter(r => r.enabled).length,
        totalTriggers: automodRules.reduce((sum, rule) => sum + rule.triggeredCount, 0)
      }
    });
  } catch (error) {
    console.error('Automod API error:', error);
    return NextResponse.json({ error: 'Failed to fetch automod data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Здесь будет логика для обновления правил автомода
    console.log('Automod rule update:', body);
    
    return NextResponse.json({ success: true, message: 'Automod rule updated' });
  } catch (error) {
    console.error('Automod update error:', error);
    return NextResponse.json({ error: 'Failed to update automod rule' }, { status: 500 });
  }
} 