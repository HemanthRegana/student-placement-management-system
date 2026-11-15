import mongoose from 'mongoose';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import User from '@/models/User';

export type UserRole =
  | 'STUDENT'
  | 'OFFICER'
  | 'COMPANY'
  | 'SUPER_ADMIN';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function getSecret() {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET is not configured');
  }

  return new TextEncoder().encode(value);
}

// Create and store an authenticated user session.
export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set('spms_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

// Retrieve the session and verify the account against MongoDB.
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('spms_session')?.value;

  if (!token) {
    return null;
  }

  let userId: string;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (typeof payload.id !== 'string') {
      return null;
    }

    userId = payload.id;
  } catch {
    return null;
  }

  // Always check the latest account status and role.
  await connectDB();

  const dbUser = await User.findById(userId)
  .select('name email role isActive')
  .lean()
  .exec() as {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  } | null;

  if (!dbUser || dbUser.isActive !== true) {
    return null;
  }

  return {
    id: String(dbUser._id),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as UserRole,
  };
}

// Check whether the current user has the required role.
export async function requireRole(roles: UserRole[]) {
  const user = await getSession();

  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

// Remove the current user's session.
export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set('spms_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
