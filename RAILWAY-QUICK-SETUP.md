# ⚡ Railway Quick Setup

## 🚀 Быстрый деплой Discord Admin Panel

### 1. Переменные окружения в Railway

Добавьте эти переменные в Railway Dashboard → Settings → Variables:

```env
# Обязательные переменные
DISCORD_TOKEN=ваш_токен_бота_discord
DISCORD_CLIENT_ID=ваш_client_id_discord_приложения
DISCORD_CLIENT_SECRET=ваш_client_secret_discord_приложения
DISCORD_GUILD_ID=id_вашего_discord_сервера
NEXTAUTH_URL=https://ваш-домен.railway.app
NEXTAUTH_SECRET=случайная_строка_32_символа

# Автоматически создается Railway при добавлении PostgreSQL
DATABASE_URL=автоматически_из_postgresql_сервиса

# Опциональные
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 2. Как получить Discord данные

1. **Зайдите в [Discord Developer Portal](https://discord.com/developers/applications)**
2. **Создайте новое приложение** или выберите существующее
3. **Скопируйте данные:**
   - `Application ID` → `DISCORD_CLIENT_ID`
   - `Client Secret` → `DISCORD_CLIENT_SECRET`
   - Создайте бота и скопируйте токен → `DISCORD_TOKEN`
4. **Получите Guild ID:**
   - Включите Developer Mode в Discord
   - ПКМ на ваш сервер → "Copy Server ID" → `DISCORD_GUILD_ID`

### 3. Настройте OAuth Redirect URI

В Discord Developer Portal → OAuth2 → Redirects добавьте:
```
https://ваш-домен.railway.app/api/auth/callback/discord
```

### 4. NEXTAUTH_SECRET

Сгенерируйте случайную строку:
```bash
openssl rand -base64 32
```
Или используйте [онлайн генератор](https://generate-secret.vercel.app/32)

### 5. Пригласите бота на сервер

1. В Discord Developer Portal → OAuth2 → URL Generator
2. Выберите scopes: `bot`, `applications.commands`
3. Выберите права: `Administrator` (или нужные права)
4. Перейдите по сгенерированной ссылке

---

## ✅ Готово!

После настройки переменных окружения Railway автоматически:
- Соберет Docker образ
- Выполнит миграции базы данных
- Запустит Discord бота и веб-панель
- Выдаст публичный URL

**Ваш Discord Admin Panel будет доступен по адресу Railway!** 🎉 