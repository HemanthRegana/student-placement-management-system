
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { createSession } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  rollNumber: z.string().min(2),
  department: z.string().min(2),
  graduationYear: z.number().int().min(2024).max(2035),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());

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

    // Public registration always creates a STUDENT account.
    const user = await User.create({
      ...data,
      email,
      passwordHash,
      role: 'STUDENT',
    });

    // Notify active Officers and Super Admins.
    // Notification failure must not prevent registration.
    try {
      const staffMembers = await User.find({
        role: { $in: ['OFFICER', 'SUPER_ADMIN'] },
        isActive: true,
      }).select('_id');

      if (staffMembers.length > 0) {
        await Notification.insertMany(
          staffMembers.map((staff) => ({
            recipient: staff._id,
            title: 'New student registered',
            message: `${user.name} (${user.email}) has registered on CampusFlow.`,
            type: 'STUDENT_REGISTERED',
            link: '/dashboard/students',
            createdBy: user._id,
          }))
        );
      }
    } catch (notificationError) {
      console.error(
        'Student registration notification failed:',
        notificationError
      );
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      { message: 'Account created successfully.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Student registration error:', error);

    const isValidationError =
      error instanceof z.ZodError;

    return NextResponse.json(
      {
        error: isValidationError
          ? 'Please check the information you entered.'
          : 'Registration could not be completed.',
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
