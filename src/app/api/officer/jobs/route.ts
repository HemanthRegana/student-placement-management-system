
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Job from '@/models/Job';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import Notification from '@/models/Notification';

const driveSchema = z.object({
  title: z.string().trim().min(3).max(120),
  companyName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5000),
  location: z.string().trim().max(200).optional().default(''),
  packageLpa: z.number().positive().max(10000),
  minCgpa: z.number().min(0).max(10),
  maxBacklogs: z.number().int().min(0).max(100),
  eligibleDepartments: z.array(z.string().trim().min(1)).default([]),
  graduationYear: z.number().int().min(2020).max(2100).nullable().optional(),
  deadline: z.string().datetime(),
});

async function authorizeStaff() {
  const user = await getSession();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      ),
    };
  }

  if (!['OFFICER', 'SUPER_ADMIN'].includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Only placement officers can manage drives.' },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

export async function GET() {
  try {
    const auth = await authorizeStaff();
    if (auth.response) return auth.response;

    await connectDB();

    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('GET officer jobs error:', error);

    return NextResponse.json(
      { error: 'Unable to load placement drives.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeStaff();
    if (auth.response) return auth.response;

    const parsed = driveSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid drive details. Please check all fields.' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const deadline = new Date(data.deadline);

    if (deadline <= new Date()) {
      return NextResponse.json(
        { error: 'The application deadline must be in the future.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create the placement drive.
    const job = await Job.create({
      ...data,
      graduationYear: data.graduationYear ?? undefined,
      deadline,
      status: 'OPEN',
      createdBy: auth.user!.id,
    });

    // Notify eligible students.
    // Notification failure must not undo drive creation.
    try {
      const profiles = await StudentProfile.find({
        verificationStatus: 'VERIFIED',
        placementStatus: 'ACTIVE_PLACEMENT',
        cgpa: { $gte: data.minCgpa },
        activeBacklogs: { $lte: data.maxBacklogs },
        ...(data.eligibleDepartments.length > 0
          ? { department: { $in: data.eligibleDepartments } }
          : {}),
        ...(data.graduationYear
          ? { graduationYear: data.graduationYear }
          : {}),
      }).select('user');

      const profileUserIds = profiles.map((profile) => profile.user);

      const eligibleStudents = await User.find({
        _id: { $in: profileUserIds },
        role: 'STUDENT',
        isActive: true,
        isVerified: true,
      }).select('_id');

      if (eligibleStudents.length > 0) {
        await Notification.insertMany(
          eligibleStudents.map((student) => ({
            recipient: student._id,
            title: 'New placement drive available',
            message: `${data.companyName} has opened a new ${data.title} placement drive. You may be eligible to apply.`,
            type: 'NEW_PLACEMENT_DRIVE',
            link: '/dashboard/jobs',
            createdBy: auth.user!.id,
          }))
        );
      }

      console.log(
        `Placement drive notification sent to ${eligibleStudents.length} eligible students.`
      );
    } catch (notificationError) {
      console.error(
        'Placement drive notification failed:',
        notificationError
      );
    }

    return NextResponse.json(
      {
        message: 'Placement drive created successfully.',
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST officer jobs error:', error);

    return NextResponse.json(
      { error: 'Unable to create placement drive.' },
      { status: 500 }
    );
  }
}
