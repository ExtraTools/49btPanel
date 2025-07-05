import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { BotEvent } from '../types';

export class EventHandler {
  private bot: DiscordBot;

  constructor(bot: DiscordBot) {
    this.bot = bot;
  }

  /**
   * Load all events from the events directory
   */
  async loadEvents(): Promise<void> {
    try {
      const eventsPath = join(__dirname, '..', 'events');
      
      // Проверяем, существует ли папка events
      try {
        const eventFiles = readdirSync(eventsPath)
          .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        let loadedEvents = 0;

        for (const file of eventFiles) {
          try {
            const filePath = join(eventsPath, file);
            
            // Используем динамический импорт с правильным URL
            const fileUrl = pathToFileURL(filePath).href;
            const event = await import(fileUrl);
            const eventModule = event.default || event;

            if (this.isValidEvent(eventModule)) {
              this.bot.events.set(eventModule.name, eventModule);

              if (eventModule.once) {
                this.bot.client.once(eventModule.name, (...args) => 
                  eventModule.execute(...args, this.bot)
                );
              } else {
                this.bot.client.on(eventModule.name, (...args) => 
                  eventModule.execute(...args, this.bot)
                );
              }

              loadedEvents++;
              logger.debug(`Loaded event: ${eventModule.name} (once: ${eventModule.once || false})`);
            } else {
              logger.warn(`Invalid event structure in file: ${filePath}`);
            }
          } catch (error) {
            logger.error(`Failed to load event from ${file}:`, {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }

        logger.info(`✅ Loaded ${loadedEvents} events`);
      } catch (error) {
        logger.warn('Events directory not found or empty, skipping event loading');
        logger.info('✅ Loaded 0 events (no events directory)');
      }
    } catch (error) {
      logger.error('Failed to load events:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Validate event structure
   */
  private isValidEvent(event: any): event is BotEvent {
    return (
      event &&
      typeof event === 'object' &&
      typeof event.name === 'string' &&
      typeof event.execute === 'function'
    );
  }

  /**
   * Reload a specific event
   */
  async reloadEvent(eventName: string): Promise<boolean> {
    try {
      const event = this.bot.events.get(eventName);
      if (!event) {
        logger.warn(`Event ${eventName} not found`);
        return false;
      }

      // Remove existing listeners
      this.bot.client.removeAllListeners(eventName);

      // Reload event
      const eventPath = join(__dirname, '..', 'events', `${eventName}.ts`);
      const fileUrl = pathToFileURL(eventPath).href;
      const newEvent = await import(fileUrl + '?update=' + Date.now());
      const eventModule = newEvent.default || newEvent;

      if (this.isValidEvent(eventModule)) {
        this.bot.events.set(eventName, eventModule);

        if (eventModule.once) {
          this.bot.client.once(eventModule.name, (...args) => 
            eventModule.execute(...args, this.bot)
          );
        } else {
          this.bot.client.on(eventModule.name, (...args) => 
            eventModule.execute(...args, this.bot)
          );
        }

        logger.info(`Reloaded event: ${eventName}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to reload event ${eventName}:`, error);
      return false;
    }
  }

  /**
   * Get event statistics
   */
  getEventStats(): any {
    const events = Array.from(this.bot.events.values());
    
    return {
      totalEvents: events.length,
      onceEvents: events.filter(event => event.once).length,
      regularEvents: events.filter(event => !event.once).length,
      eventNames: events.map(event => event.name),
    };
  }
} 