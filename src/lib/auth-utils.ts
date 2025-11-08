// Authentication utilities for API calls

import { getSession } from 'next-auth/react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  expires: string;
}

// Get current session with token
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const session = await getSession();
    return session as AuthSession;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// Get auth token for API calls
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getCurrentSession();
    return session?.accessToken || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role === 'ADMIN';
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession();
  return session?.user || null;
}