import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discordId: string;
      username: string;
      discriminator: string;
      avatar: string;
      email: string;
      name?: string;
      image?: string;
      isAdmin: boolean;
      isModerator: boolean;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
    isAdmin: boolean;
    isModerator: boolean;
    permissions: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
    isAdmin: boolean;
    isModerator: boolean;
    permissions: string[];
  }
} 