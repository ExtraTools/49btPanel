# Деплой Discord Admin Panel на Railway

## Подготовка к деплою

### 1. Создание аккаунта на Railway
1. Зайдите на [railway.app](https://railway.app)
2. Зарегистрируйтесь через GitHub
3. Подключите ваш GitHub репозиторий

### 2. Настройка PostgreSQL базы данных
1. В Railway создайте новый сервис PostgreSQL
2. Скопируйте DATABASE_URL из переменных окружения
3. Добавьте в переменные окружения вашего проекта

### 3. Настройка переменных окружения
Добавьте следующие переменные в Railway:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Discord Bot
DISCORD_TOKEN=ваш_токен_бота
DISCORD_CLIENT_ID=ваш_client_id
DISCORD_CLIENT_SECRET=ваш_client_secret
DISCORD_GUILD_ID=ваш_guild_id

# NextAuth
NEXTAUTH_URL=https://ваш-домен.railway.app
NEXTAUTH_SECRET=случайная_строка_32_символа

# Application
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Security
ADMIN_USERS=ваш_discord_id

# Features
ENABLE_ANALYTICS=true
ENABLE_AUTOMOD=true
ENABLE_TICKETS=true
```

### 4. Настройка Discord приложения
1. Зайдите в [Discord Developer Portal](https://discord.com/developers/applications)
2. Обновите Redirect URI на `https://ваш-домен.railway.app/api/auth/callback/discord`
3. Добавьте новый домен в разрешенные Origins

## Деплой

### 1. Автоматический деплой
Railway автоматически деплоит из GitHub при push в main ветку.

### 2. Ручной деплой
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите в аккаунт
railway login

# Деплой проекта
railway up
```

### 3. Миграции базы данных
Railway автоматически выполнит миграции при деплое благодаря `railway:build` скрипту.

## Мониторинг

### 1. Логи
Просматривайте логи в Railway Dashboard:
- Логи приложения
- Логи базы данных
- Логи сборки

### 2. Метрики
Railway показывает:
- Использование CPU
- Использование памяти
- Сетевой трафик
- Время отклика

### 3. Healthcheck
Приложение включает endpoint `/api/health` для проверки состояния.

## Настройка домена

### 1. Пользовательский домен
1. В Railway Settings добавьте ваш домен
2. Настройте DNS записи согласно инструкции
3. Обновите NEXTAUTH_URL в переменных окружения

### 2. SSL сертификат
Railway автоматически выдает SSL сертификат для всех доменов.

## Масштабирование

### 1. Горизонтальное масштабирование
Railway автоматически масштабирует приложение при необходимости.

### 2. Вертикальное масштабирование
Измените размер контейнера в Settings если нужно больше ресурсов.

## Резервное копирование

### 1. База данных
Railway автоматически создает резервные копии PostgreSQL.

### 2. Код
Храните код в приватном GitHub репозитории.

## Безопасность

### 1. Переменные окружения
Все секреты хранятся в зашифрованном виде в Railway.

### 2. HTTPS
Весь трафик автоматически шифруется через HTTPS.

### 3. Сетевая безопасность
Railway использует изолированную сеть для каждого проекта.

## Troubleshooting

### 1. Проблемы с деплоем
- Проверьте логи сборки
- Убедитесь что все переменные окружения заданы
- Проверьте Dockerfile syntax

### 2. Проблемы с базой данных
- Проверьте DATABASE_URL
- Убедитесь что PostgreSQL сервис запущен
- Проверьте миграции в логах

### 3. Проблемы с Discord ботом
- Проверьте DISCORD_TOKEN
- Убедитесь что бот приглашен на сервер
- Проверьте права бота

## Полезные команды

```bash
# Просмотр логов
railway logs

# Подключение к базе данных
railway connect postgres

# Запуск миграций
railway run prisma migrate deploy

# Генерация Prisma client
railway run prisma generate

# Открытие админки базы данных
railway run prisma studio
```

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Railway Dashboard
2. Убедитесь что все переменные окружения заданы
3. Проверьте статус сервисов
4. Обратитесь в поддержку Railway через Discord 