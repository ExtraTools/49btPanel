#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Discord Admin Panel...\n');

// Start Next.js development server
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Start Discord bot
const botProcess = spawn('npm', ['run', 'bot:dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill('SIGINT');
  botProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill('SIGTERM');
  botProcess.kill('SIGTERM');
  process.exit(0);
});

nextProcess.on('exit', () => {
  console.log('Next.js process exited');
  botProcess.kill('SIGTERM');
});

botProcess.on('exit', () => {
  console.log('Bot process exited');
  nextProcess.kill('SIGTERM');
}); 