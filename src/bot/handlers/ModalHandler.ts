import { Events } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { ModalHandler as ModalHandlerType } from '../types';

export class ModalHandler {
  private bot: DiscordBot;
  private handlers: Map<string, ModalHandlerType> = new Map();

  constructor(bot: DiscordBot) {
    this.bot = bot;
    
    // Register modal interaction handler
    this.bot.client.on(Events.InteractionCreate, this.handleModalInteraction.bind(this));
  }

  /**
   * Load all modal handlers
   */
  async loadModals(): Promise<void> {
    try {
      const modalsPath = join(__dirname, '..', 'modals');
      
      // Проверяем, существует ли папка modals
      try {
        const modalFiles = readdirSync(modalsPath)
          .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

        let loadedModals = 0;

        for (const file of modalFiles) {
          try {
            const filePath = join(modalsPath, file);
            
            // Используем динамический импорт с правильным URL
            const fileUrl = pathToFileURL(filePath).href;
            const modal = await import(fileUrl);
            const modalModule = modal.default || modal;

            if (this.isValidModalHandler(modalModule)) {
              this.handlers.set(modalModule.customId, modalModule);
              loadedModals++;
              logger.debug(`Loaded modal handler: ${modalModule.customId}`);
            } else {
              logger.warn(`Invalid modal handler structure in file: ${filePath}`);
            }
          } catch (error) {
            logger.error(`Failed to load modal handler from ${file}:`, {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }

        logger.info(`✅ Loaded ${loadedModals} modal handlers`);
      } catch (error) {
        logger.warn('Modals directory not found or empty, skipping modal loading');
        logger.info('✅ Loaded 0 modal handlers (no modals directory)');
      }
    } catch (error) {
      logger.error('Failed to load modal handlers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Validate modal handler structure
   */
  private isValidModalHandler(handler: any): handler is ModalHandlerType {
    return (
      handler &&
      typeof handler === 'object' &&
      typeof handler.customId === 'string' &&
      typeof handler.execute === 'function'
    );
  }

  /**
   * Handle modal interactions
   */
  private async handleModalInteraction(interaction: any): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    const customId = interaction.customId;
    
    // Support for dynamic custom IDs
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
      logger.warn(`No handler found for modal: ${customId}`);
      return;
    }

    try {
      await handler.execute(interaction, this.bot);

      // Track analytics
      await this.bot.analytics.trackInteraction(
        'modal',
        customId,
        interaction.user.id,
        interaction.guildId
      );

      logger.debug(`Modal interaction handled: ${customId} by ${interaction.user.id}`);
    } catch (error) {
      logger.error(`Error handling modal interaction ${customId}:`, error);

      const errorMessage = '❌ Произошла ошибка при обработке формы.';
      
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
   * Register a modal handler dynamically
   */
  registerHandler(customId: string, handler: ModalHandlerType): void {
    this.handlers.set(customId, handler);
    logger.debug(`Registered modal handler: ${customId}`);
  }

  /**
   * Unregister a modal handler
   */
  unregisterHandler(customId: string): boolean {
    const success = this.handlers.delete(customId);
    if (success) {
      logger.debug(`Unregistered modal handler: ${customId}`);
    }
    return success;
  }

  /**
   * Get modal handler statistics
   */
  getModalStats(): any {
    return {
      totalHandlers: this.handlers.size,
      handlerIds: Array.from(this.handlers.keys()),
    };
  }
} 