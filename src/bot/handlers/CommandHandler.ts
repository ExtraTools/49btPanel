import { Collection, Events, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger';
import type { DiscordBot } from '../index';
import type { Command } from '../types';

export class CommandHandler {
  private bot: DiscordBot;
  private rest: REST;

  constructor(bot: DiscordBot) {
    this.bot = bot;
    this.rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
    
    // Register interaction handler
    this.bot.client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
  }

  /**
   * Load all commands from the commands directory
   */
  async loadCommands(): Promise<void> {
    try {
      const commandsPath = join(__dirname, '..', 'commands');
      
      // Проверяем, существует ли папка commands
      try {
        const categories = readdirSync(commandsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        let loadedCommands = 0;

        for (const category of categories) {
          const categoryPath = join(commandsPath, category);
          try {
            const commandFiles = readdirSync(categoryPath)
              .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

            for (const file of commandFiles) {
              try {
                const filePath = join(categoryPath, file);
                
                // Используем динамический импорт с правильным URL
                const fileUrl = pathToFileURL(filePath).href;
                const command = await import(fileUrl);
                const commandModule = command.default || command;

                if (this.isValidCommand(commandModule)) {
                  commandModule.category = category;
                  this.bot.commands.set(commandModule.data.name, commandModule);
                  loadedCommands++;
                  logger.debug(`Loaded command: ${commandModule.data.name} from ${category}`);
                } else {
                  logger.warn(`Invalid command structure in file: ${filePath}`);
                }
              } catch (error) {
                logger.error(`Failed to load command from ${file}:`, {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            }
          } catch (error) {
            logger.warn(`Category directory ${category} not accessible, skipping`);
          }
        }

        logger.info(`✅ Loaded ${loadedCommands} commands from ${categories.length} categories`);

        // Deploy commands to Discord
        await this.deployCommands();
      } catch (error) {
        logger.warn('Commands directory not found or empty, skipping command loading');
        logger.info('✅ Loaded 0 commands (no commands directory)');
      }
    } catch (error) {
      logger.error('Failed to load commands:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Validate command structure
   */
  private isValidCommand(command: any): command is Command {
    return (
      command &&
      typeof command === 'object' &&
      command.data &&
      typeof command.data.name === 'string' &&
      typeof command.execute === 'function'
    );
  }

  /**
   * Deploy commands to Discord API
   */
  private async deployCommands(): Promise<void> {
    try {
      const commands = Array.from(this.bot.commands.values())
        .map(command => command.data.toJSON());

      logger.info(`🚀 Deploying ${commands.length} application commands...`);

      if (commands.length === 0) {
        logger.info('✅ No commands to deploy');
        return;
      }

      const data = await this.rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID!
        ),
        { body: commands }
      ) as any[];

      logger.info(`✅ Successfully deployed ${data.length} application commands`);
    } catch (error) {
      logger.error('Failed to deploy commands:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Handle slash command interactions
   */
  private async handleInteraction(interaction: any): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.bot.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      // Check permissions
      if (command.permissions && command.permissions.length > 0) {
        const member = interaction.member;
        if (!member || !member.permissions.has(command.permissions)) {
          await interaction.reply({
            content: '❌ У вас нет прав для выполнения этой команды.',
            ephemeral: true,
          });
          return;
        }
      }

      // Check if command is owner only
      if (command.ownerOnly) {
        const guild = await this.bot.prisma.guild.findUnique({
          where: { discordId: interaction.guildId },
        });

        if (!guild || guild.ownerId !== interaction.user.id) {
          await interaction.reply({
            content: '❌ Эта команда доступна только владельцу сервера.',
            ephemeral: true,
          });
          return;
        }
      }

      // Check if command is guild only
      if (command.guildOnly && !interaction.guildId) {
        await interaction.reply({
          content: '❌ Эта команда может быть использована только на сервере.',
          ephemeral: true,
        });
        return;
      }

      // Check cooldown
      if (command.cooldown) {
        const cooldownKey = `${interaction.user.id}:${command.data.name}`;
        const isOnCooldown = await this.bot.cache.isOnCooldown(interaction.user.id, command.data.name);
        
        if (isOnCooldown) {
          await interaction.reply({
            content: `⏰ Подождите ${command.cooldown} секунд перед повторным использованием команды.`,
            ephemeral: true,
          });
          return;
        }

        // Set cooldown
        await this.bot.cache.setCooldown(interaction.user.id, command.data.name, command.cooldown);
      }

      // Execute command
      await command.execute(interaction, this.bot);

      // Track analytics
      await this.bot.analytics.trackCommand(
        command.data.name,
        interaction.user.id,
        interaction.guildId,
        true
      );

      logger.command(command.data.name, interaction.user.id, interaction.guildId);
    } catch (error) {
      logger.error(`Error executing command ${command.data.name}:`, error);

      // Track failed command
      await this.bot.analytics.trackCommand(
        command.data.name,
        interaction.user.id,
        interaction.guildId,
        false
      );

      const errorMessage = '❌ Произошла ошибка при выполнении команды.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  }

  /**
   * Handle autocomplete interactions
   */
  async handleAutocomplete(interaction: any): Promise<void> {
    const command = this.bot.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction, this.bot);
    } catch (error) {
      logger.error(`Error handling autocomplete for ${command.data.name}:`, error);
    }
  }

  /**
   * Reload a specific command
   */
  async reloadCommand(commandName: string): Promise<boolean> {
    try {
      const command = this.bot.commands.get(commandName);
      if (!command) {
        logger.warn(`Command ${commandName} not found`);
        return false;
      }

      // Clear require cache
      const commandPath = join(__dirname, '..', 'commands', command.category || '', `${commandName}.ts`);
      delete require.cache[require.resolve(commandPath)];

      // Reload command
      const newCommand = await import(commandPath);
      const commandModule = newCommand.default || newCommand;

      if (this.isValidCommand(commandModule)) {
        commandModule.category = command.category;
        this.bot.commands.set(commandName, commandModule);
        logger.info(`Reloaded command: ${commandName}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to reload command ${commandName}:`, error);
      return false;
    }
  }

  /**
   * Get command statistics
   */
  getCommandStats(): any {
    const commands = Array.from(this.bot.commands.values());
    const categories = [...new Set(commands.map(cmd => cmd.category))];

    return {
      totalCommands: commands.length,
      categories: categories.length,
      commandsByCategory: categories.reduce((acc, category) => {
        acc[category || 'uncategorized'] = commands.filter(cmd => cmd.category === category).length;
        return acc;
      }, {} as Record<string, number>),
    };
  }
} 