import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL

if (!ALLOWED_EMAIL && process.env.NODE_ENV === "production") {
  throw new Error("ALLOWED_EMAIL environment variable is required in production")
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        if (!ALLOWED_EMAIL) return true
        return profile.email === ALLOWED_EMAIL
      }
      return false
    },
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
      }
      return token
    },
  },
}
