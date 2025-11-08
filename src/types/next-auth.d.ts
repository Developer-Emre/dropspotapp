declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      email?: string
      name?: string
      role?: 'USER' | 'ADMIN'
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role?: 'USER' | 'ADMIN'
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: 'USER' | 'ADMIN'
    accessToken?: string
  }
}