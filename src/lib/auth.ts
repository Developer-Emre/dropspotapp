import CredentialsProvider from 'next-auth/providers/credentials'
import { loginUser } from './api'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const result = await loginUser({
            email: credentials.email,
            password: credentials.password
          })

          if (result.success && result.data) {
            return {
              id: result.data.user.id,
              email: result.data.user.email,
              name: result.data.user.name,
              role: result.data.user.role,
              accessToken: result.data.token
            }
          }

          // Log the actual error for debugging
          console.error('Login failed:', {
            error: result.error,
            status: result.status,
            message: result.message
          })

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: parseInt(process.env.SESSION_TIMEOUT || '86400'), // 24 hours
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.role = user.role
        token.accessToken = user.accessToken
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id || token.sub
        session.user.role = token.role
        session.accessToken = token.accessToken
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  events: {
    async signIn(message: any) {
      console.log('User signed in:', message.user.email)
    },
    async signOut(message: any) {
      console.log('User signed out:', message.token?.email || 'unknown')
    }
  },
  // Security options
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
}