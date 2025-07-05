import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  ButtonInteraction, 
  ModalSubmitInteraction,
  AutocompleteInteraction,
  PermissionResolvable,
  Guild,
  GuildMember,
  User
} from 'discord.js';
import type { DiscordBot } from '../index';

export interface Command {
  data: SlashCommandBuilder;
  category?: string;
  permissions?: PermissionResolvable[];
  cooldown?: number;
  ownerOnly?: boolean;
  guildOnly?: boolean;
  execute: (interaction: CommandInteraction, bot: DiscordBot) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, bot: DiscordBot) => Promise<void>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

export interface ButtonHandler {
  customId: string;
  execute: (interaction: ButtonInteraction, bot: DiscordBot) => Promise<void>;
}

export interface ModalHandler {
  customId: string;
  execute: (interaction: ModalSubmitInteraction, bot: DiscordBot) => Promise<void>;
}

export interface ModerationAction {
  id: string;
  type: 'warn' | 'mute' | 'kick' | 'ban' | 'timeout';
  userId: string;
  guildId: string;
  moderatorId: string;
  reason?: string;
  duration?: number; // in milliseconds
  expiresAt?: Date;
  isActive: boolean;
}

export interface AutoModRule {
  id: string;
  name: string;
  type: 'spam' | 'links' | 'caps' | 'profanity' | 'mentions' | 'duplicates';
  enabled: boolean;
  config: {
    // Spam detection
    maxMessages?: number;
    timeWindow?: number; // in seconds
    
    // Links
    allowedDomains?: string[];
    blockedDomains?: string[];
    
    // Caps
    maxCapsPercentage?: number;
    minLength?: number;
    
    // Mentions
    maxMentions?: number;
    
    // Custom words/patterns
    blockedWords?: string[];
    allowedWords?: string[];
    useRegex?: boolean;
  };
  actions: {
    deleteMessage?: boolean;
    warnUser?: boolean;
    muteUser?: boolean;
    banUser?: boolean;
    logAction?: boolean;
    muteDuration?: number; // in minutes
  };
}

export interface GuildConfig {
  id: string;
  guildId: string;
  prefix: string;
  modLogChannel?: string;
  welcomeChannel?: string;
  muteRole?: string;
  autoRole?: string;
  autoModEnabled: boolean;
  maxWarnings: number;
  warningExpiry: number; // in days
  ticketsEnabled: boolean;
  ticketCategory?: string;
  ticketLogChannel?: string;
  customCommands: Record<string, string>;
  disabledCommands: string[];
  levelingEnabled: boolean;
  economyEnabled: boolean;
}

export interface UserData {
  id: string;
  discordId: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  warnings: number;
  lastWarningAt?: Date;
  isMuted: boolean;
  muteExpiresAt?: Date;
  permissions: string[];
}

export interface TicketData {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  guildId: string;
  channelId?: string;
  assignedTo?: string;
  createdAt: Date;
  closedAt?: Date;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: Date;
  messageId?: string;
}

export interface AnalyticsEvent {
  type: 'command' | 'interaction' | 'automod' | 'moderation' | 'user_activity';
  event: string;
  guildId?: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface CacheItem<T = any> {
  data: T;
  expiresAt: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface EmbedConfig {
  color?: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  image?: string;
  footer?: {
    text: string;
    iconURL?: string;
  };
  author?: {
    name: string;
    iconURL?: string;
    url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  timestamp?: boolean;
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
  dependencies?: string[];
  permissions?: string[];
}

// Utility types
export type GuildWithMember = Guild & {
  member: GuildMember;
};

export type UserWithMember = User & {
  member?: GuildMember;
};

export type CommandCategory = 
  | 'admin'
  | 'moderation'
  | 'utility'
  | 'fun'
  | 'music'
  | 'economy'
  | 'leveling'
  | 'tickets'
  | 'automod'
  | 'settings';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type PermissionLevel = 'user' | 'moderator' | 'admin' | 'owner';

// Event types
export type BotEventName = 
  | 'ready'
  | 'guildCreate'
  | 'guildDelete'
  | 'guildMemberAdd'
  | 'guildMemberRemove'
  | 'messageCreate'
  | 'messageDelete'
  | 'messageUpdate'
  | 'interactionCreate'
  | 'voiceStateUpdate'
  | 'guildBanAdd'
  | 'guildBanRemove';

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Database types (extend Prisma types)
export type DatabaseUser = {
  id: string;
  discordId: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  email?: string;
  isAdmin: boolean;
  isModerator: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
};

export type DatabaseGuild = {
  id: string;
  discordId: string;
  name: string;
  icon?: string;
  ownerId: string;
  botEnabled: boolean;
  prefix: string;
  createdAt: Date;
  updatedAt: Date;
};

// AI Integration types
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

// Webhook types
export interface WebhookEvent {
  type: string;
  guildId?: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

// Export everything
export * from './commands';
export * from './events';
export * from './moderation';
export * from './tickets'; 