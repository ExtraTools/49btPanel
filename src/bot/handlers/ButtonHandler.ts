import { Events } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { ButtonHandler as ButtonHandlerType } from '../types';

export class ButtonHandler {
  private bot: DiscordBot;
  private handlers: Map<string, ButtonHandlerType> = new Map();

  constructor(bot: DiscordBot) {
    this.bot = bot;
    
    // Register button interaction handler
    this.bot.client.on(Events.InteractionCreate, this.handleButtonInteraction.bind(this));
  }

  /**
   * Load all button handlers
   */
  async loadButtons(): Promise<void> {
    try {
      const buttonsPath = join(__dirname, '..', 'buttons');
      
      // Проверяем, существует ли папка buttons
      try {
        const buttonFiles = readdirSync(buttonsPath)
          .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        let loadedButtons = 0;

        for (const file of buttonFiles) {
          try {
            const filePath = join(buttonsPath, file);
            
            // Используем динамический импорт с правильным URL
            const fileUrl = pathToFileURL(filePath).href;
            const button = await import(fileUrl);
            const buttonModule = button.default || button;

            if (this.isValidButtonHandler(buttonModule)) {
              this.handlers.set(buttonModule.customId, buttonModule);
              loadedButtons++;
              logger.debug(`Loaded button handler: ${buttonModule.customId}`);
            } else {
              logger.warn(`Invalid button handler structure in file: ${filePath}`);
            }
          } catch (error) {
            logger.error(`Failed to load button handler from ${file}:`, {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }

        logger.info(`✅ Loaded ${loadedButtons} button handlers`);
      } catch (error) {
        logger.warn('Buttons directory not found or empty, skipping button loading');
        logger.info('✅ Loaded 0 button handlers (no buttons directory)');
      }
    } catch (error) {
      logger.error('Failed to load button handlers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Validate button handler structure
   */
  private isValidButtonHandler(handler: any): handler is ButtonHandlerType {
    return (
      handler &&
      typeof handler === 'object' &&
      typeof handler.customId === 'string' &&
      typeof handler.execute === 'function'
    );
  }

  /**
   * Handle button interactions
   */
  private async handleButtonInteraction(interaction: any): Promise<void> {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    
    // Support for dynamic custom IDs (e.g., "ticket_close_123")
    let handler = this.handlers.get(customId);
    
    if (!handler) {
      // Try to find handler with partial match
      for (const [handlerCustomId, handlerObj] of this.handlers.entries()) {
        if (customId.startsWith(handlerCustomId)) {
          handler = handlerObj;
          break;
        }
      }
    }

    if (!handler) {
      logger.warn(`No handler found for button: ${customId}`);
      return;
    }

    try {
      await handler.execute(interaction, this.bot);

      // Track analytics
      await this.bot.analytics.trackInteraction(
        'button',
        customId,
        interaction.user.id,
        interaction.guildId
      );

      logger.debug(`Button interaction handled: ${customId} by ${interaction.user.id}`);
    } catch (error) {
      logger.error(`Error handling button interaction ${customId}:`, error);

      const errorMessage = '❌ Произошла ошибка при обработке взаимодействия.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        }).catch(() => {});
      }
    }
  }

  /**
   * Register a button handler dynamically
   */
  registerHandler(customId: string, handler: ButtonHandlerType): void {
    this.handlers.set(customId, handler);
    logger.debug(`Registered button handler: ${customId}`);
  }

  /**
   * Unregister a button handler
   */
  unregisterHandler(customId: string): boolean {
    const success = this.handlers.delete(customId);
    if (success) {
      logger.debug(`Unregistered button handler: ${customId}`);
    }
    return success;
  }

  /**
   * Get button handler statistics
   */
  getButtonStats(): any {
    return {
      totalHandlers: this.handlers.size,
      handlerIds: Array.from(this.handlers.keys()),
    };
  }
} 