#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Railway deployment process...');

// Функция для выполнения команды
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${command} failed with exit code ${code}`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${command}:`, error);
      reject(error);
    });
  });
}

async function main() {
  try {
    // Проверяем переменные окружения
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set');
      process.exit(1);
    }

    console.log('🔧 Environment check passed');

    // Выполняем миграции базы данных
    console.log('🗄️  Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);

    // Генерируем Prisma Client (на всякий случай)
    console.log('🔄 Generating Prisma Client...');
    await runCommand('npx', ['prisma', 'generate']);

    // Запускаем приложение
    console.log('🚀 Starting application...');
    await runCommand('node', ['start.js']);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Обрабатываем сигналы для корректного завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 