
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(await req.json());

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Prevent deactivated accounts from signing in.
    if (user.isActive === false) {
      return NextResponse.json(
        {
          error:
            'Your account has been deactivated. Contact the placement office.',
        },
        { status: 403 }
      );
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ message: 'Signed in.' });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: 'Please provide a valid email and password.' },
      { status: 400 }
    );
  }
}
