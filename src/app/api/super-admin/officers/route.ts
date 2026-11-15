
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const officerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const officers = await User.find({ role: 'OFFICER' })
      .select('name email isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ officers });
  } catch (error) {
    console.error('Officer list error:', error);

    return NextResponse.json(
      { error: 'Unable to load officers.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin access required.' },
        { status: 403 }
      );
    }

    const data = officerSchema.parse(await request.json());

    await connectDB();

    const email = data.email.toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const officer = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: 'OFFICER',
      isActive: true,
      isVerified: true,
    });

    return NextResponse.json(
      {
        message: 'Placement Officer created successfully.',
        officer: {
          id: officer.id,
          name: officer.name,
          email: officer.email,
          role: officer.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Please provide valid details. Password must be at least 12 characters.' },
        { status: 400 }
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    console.error('Officer creation error:', error);

    return NextResponse.json(
      { error: 'Unable to create Placement Officer.' },
      { status: 500 }
    );
  }
}
