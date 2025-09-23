import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const credentialsProvider = Credentials({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (credentials) => {
    if (!credentials?.email || !credentials.password) {
      throw new Error("Missing credentials");
    }

    const email = credentials.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.hashedPassword || user.deletedAt) {
      return null;
    }

    const isValidPassword = await compare(credentials.password, user.hashedPassword);

    if (!isValidPassword) {
      return null;
    }

    return user;
  },
});

const providers: NextAuthOptions["providers"] = [
  credentialsProvider,
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
    if (user) {
      token.sub = user.id;
      token.id = user.id;
      token.role = (user as { role?: Role }).role ?? token.role;
      token.stripeCustomerId = (user as { stripeCustomerId?: string | null }).stripeCustomerId ?? token.stripeCustomerId;
    } else if (token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          token.role = dbUser.role;
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.id = dbUser.id;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as Role) ?? Role.customer;
        session.user.stripeCustomerId = (token.stripeCustomerId as string | null) ?? null;
      }

      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  events: {
    async linkAccount({ user }) {
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const getAuthSession = () => getServerSession(authOptions);
