import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  logToFile: boolean;
  logDir: string;
  maxFileSize: number; // in MB
  maxFiles: number;
  colors: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logStream?: fs.WriteStream;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      logToFile: process.env.LOG_TO_FILE === 'true',
      logDir: './logs',
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      colors: true,
      ...config,
    };

    if (this.config.logToFile) {
      this.setupFileLogging();
    }
  }

  private setupFileLogging(): void {
    // Ensure log directory exists
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }

    // Create log file with date
    const logFileName = `bot-${format(new Date(), 'yyyy-MM-dd')}.log`;
    const logFilePath = path.join(this.config.logDir, logFileName);

    this.logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    // Rotate logs if needed
    this.rotateLogs();
  }

  private rotateLogs(): void {
    const logFiles = fs.readdirSync(this.config.logDir)
      .filter(file => file.startsWith('bot-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(this.config.logDir, file),
        stats: fs.statSync(path.join(this.config.logDir, file)),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // Remove old log files if we exceed maxFiles
    if (logFiles.length > this.config.maxFiles) {
      const filesToDelete = logFiles.slice(this.config.maxFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }

    // Check current log file size
    const currentLogFile = logFiles[0];
    if (currentLogFile && currentLogFile.stats.size > this.config.maxFileSize * 1024 * 1024) {
      // Create new log file
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const newLogFileName = `bot-${timestamp}.log`;
      const newLogFilePath = path.join(this.config.logDir, newLogFileName);
      
      this.logStream?.end();
      this.logStream = fs.createWriteStream(newLogFilePath, { flags: 'a' });
    }
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const levelStr = LogLevel[level].toUpperCase().padEnd(5);
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${levelStr}] ${message}${formattedArgs}`;
  }

  private getColorCode(level: LogLevel): string {
    if (!this.config.colors) return '';
    
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      default:
        return '';
    }
  }

  private getResetCode(): string {
    return this.config.colors ? '\x1b[0m' : '';
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.config.level) return;

    const formattedMessage = this.formatMessage(level, message, ...args);
    const colorCode = this.getColorCode(level);
    const resetCode = this.getResetCode();

    // Console output with colors
    console.log(`${colorCode}${formattedMessage}${resetCode}`);

    // File output without colors
    if (this.config.logToFile && this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  // Specific logging methods for bot events
  command(commandName: string, userId: string, guildId?: string): void {
    this.info(`Command executed: ${commandName} by ${userId}${guildId ? ` in ${guildId}` : ''}`);
  }

  moderation(action: string, moderatorId: string, targetId: string, guildId: string, reason?: string): void {
    this.info(`Moderation action: ${action} by ${moderatorId} on ${targetId} in ${guildId}${reason ? ` - ${reason}` : ''}`);
  }

  automod(rule: string, userId: string, guildId: string, action: string): void {
    this.info(`AutoMod triggered: ${rule} for ${userId} in ${guildId} - ${action}`);
  }

  ticket(action: string, ticketId: string, userId: string, guildId: string): void {
    this.info(`Ticket ${action}: ${ticketId} by ${userId} in ${guildId}`);
  }

  guild(action: string, guildId: string, guildName: string): void {
    this.info(`Guild ${action}: ${guildName} (${guildId})`);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: any): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, context);
  }

  // Database logging
  database(query: string, duration: number, error?: any): void {
    if (error) {
      this.error(`Database error in query: ${query}`, error);
    } else {
      this.debug(`Database query: ${query} (${duration}ms)`);
    }
  }

  // API logging
  api(method: string, endpoint: string, status: number, duration: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.log(level, `API ${method} ${endpoint} - ${status} (${duration}ms)`);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// Create default logger instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG :
         process.env.LOG_LEVEL === 'warn' ? LogLevel.WARN :
         process.env.LOG_LEVEL === 'error' ? LogLevel.ERROR :
         LogLevel.INFO,
});

// Export Logger class for custom instances
export { Logger };

// Helper function to time operations
export function measureTime<T>(operation: () => Promise<T>, name: string): Promise<T> {
  const start = Date.now();
  return operation().then(
    (result) => {
      const duration = Date.now() - start;
      logger.performance(name, duration);
      return result;
    },
    (error) => {
      const duration = Date.now() - start;
      logger.performance(`${name} (failed)`, duration, error);
      throw error;
    }
  );
}

// Helper function to time sync operations
export function measureTimeSync<T>(operation: () => T, name: string): T {
  const start = Date.now();
  try {
    const result = operation();
    const duration = Date.now() - start;
    logger.performance(name, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.performance(`${name} (failed)`, duration, error);
    throw error;
  }
} 