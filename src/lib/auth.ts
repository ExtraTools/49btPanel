import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { logger } from './logger';

const scopes = ['identify', 'email', 'guilds'].join(' ');

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: scopes } },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'discord' && profile) {
          const discordProfile = profile as any;
          
          // Check if user exists in our database
          const existingUser = await prisma.user.findUnique({
            where: { discordId: discordProfile.id },
          });

          if (existingUser) {
            // Update existing user data
            await prisma.user.update({
              where: { discordId: discordProfile.id },
              data: {
                username: discordProfile.username,
                discriminator: discordProfile.discriminator,
                avatar: discordProfile.avatar,
                email: discordProfile.email,
                lastLogin: new Date(),
              },
            });
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                discordId: discordProfile.id,
                username: discordProfile.username,
                discriminator: discordProfile.discriminator,
                avatar: discordProfile.avatar,
                email: discordProfile.email,
                lastLogin: new Date(),
              },
            });
          }

          logger.info(`User signed in: ${discordProfile.username}#${discordProfile.discriminator} (${discordProfile.id})`);
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Error during sign in:', error);
        return false;
      }
    },

    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        const discordProfile = profile as any;
        
        // Get user from database with permissions
        const dbUser = await prisma.user.findUnique({
          where: { discordId: discordProfile.id },
          select: {
            id: true,
            discordId: true,
            username: true,
            discriminator: true,
            avatar: true,
            email: true,
            isAdmin: true,
            isModerator: true,
            permissions: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.discordId = dbUser.discordId;
          token.username = dbUser.username;
          token.discriminator = dbUser.discriminator;
          token.avatar = dbUser.avatar;
          token.email = dbUser.email;
          token.isAdmin = dbUser.isAdmin;
          token.isModerator = dbUser.isModerator;
          token.permissions = dbUser.permissions;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.discordId = token.discordId as string;
        session.user.username = token.username as string;
        session.user.discriminator = token.discriminator as string;
        session.user.avatar = token.avatar as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isModerator = token.isModerator as boolean;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (account?.provider === 'discord') {
        logger.info(`Discord OAuth sign in: ${profile?.username || user.name} (new user: ${isNewUser})`);
      }
    },
    async signOut({ token, session }) {
      logger.info(`User signed out: ${token?.username || session?.user?.name}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Helper functions for permission checking
export async function hasPermission(userDiscordId: string, permission: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { discordId: userDiscordId },
      select: { permissions: true, isAdmin: true },
    });

    if (!user) return false;
    if (user.isAdmin) return true; // Admins have all permissions
    
    return user.permissions.includes(permission);
  } catch (error) {
    logger.error('Error checking permission:', error);
    return false;
  }
}

export async function hasGuildAccess(userDiscordId: string, guildId: string): Promise<boolean> {
  try {
    // Check if user is member of the guild
    const guildMember = await prisma.guildMember.findFirst({
      where: {
        user: { discordId: userDiscordId },
        guild: { discordId: guildId },
      },
      include: {
        user: { select: { isAdmin: true, isModerator: true } },
      },
    });

    if (!guildMember) return false;
    
    // Admins and moderators have access
    return guildMember.user.isAdmin || guildMember.user.isModerator;
  } catch (error) {
    logger.error('Error checking guild access:', error);
    return false;
  }
}

export async function isGuildOwner(userDiscordId: string, guildId: string): Promise<boolean> {
  try {
    const guild = await prisma.guild.findFirst({
      where: {
        discordId: guildId,
        ownerId: userDiscordId,
      },
    });

    return !!guild;
  } catch (error) {
    logger.error('Error checking guild ownership:', error);
    return false;
  }
}

// Permissions constants
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_PANEL: 'admin.panel',
  ADMIN_USERS: 'admin.users',
  ADMIN_GUILDS: 'admin.guilds',
  ADMIN_SYSTEM: 'admin.system',
  
  // Moderation permissions
  MOD_KICK: 'mod.kick',
  MOD_BAN: 'mod.ban',
  MOD_MUTE: 'mod.mute',
  MOD_WARN: 'mod.warn',
  MOD_VIEW_LOGS: 'mod.view_logs',
  
  // Ticket permissions
  TICKET_VIEW: 'ticket.view',
  TICKET_MANAGE: 'ticket.manage',
  TICKET_ASSIGN: 'ticket.assign',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_ADVANCED: 'settings.advanced',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]; 