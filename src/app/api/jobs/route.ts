
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Job from '@/models/Job';
import Application from '@/models/Application';
import { z } from 'zod';

// GET: Display open drives and the student's existing applications
export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const jobs = await Job.find({
      status: 'OPEN',
      deadline: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    let appliedJobIds: string[] = [];

    if (user.role === 'STUDENT') {
      const applications = await Application.find({
        student: user.id,
      })
        .select('job')
        .lean();

      appliedJobIds = applications.map((application) =>
        String(application.job)
      );
    }

    return NextResponse.json({
      jobs,
      appliedJobIds,
    });
  } catch (error) {
    console.error('GET jobs error:', error);

    return NextResponse.json(
      { error: 'Unable to load placement drives.' },
      { status: 500 }
    );
  }
}

// Placement drive validation
const schema = z.object({
  title: z.string().trim().min(3),
  companyName: z.string().trim().min(2),
  description: z.string().trim().min(10),
  location: z.string().optional(),
  packageLpa: z.number().positive(),
  minCgpa: z.number().min(0).max(10).default(0),
  maxBacklogs: z.number().int().min(0).default(0),
  eligibleDepartments: z.array(z.string()).default([]),
  graduationYear: z.number().int().optional(),
  deadline: z.string().datetime(),
});

// POST: Only officers and super admins can create drives
export async function POST(req: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      );
    }

    if (!['OFFICER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only placement officers can publish drives.' },
        { status: 403 }
      );
    }

    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid placement drive details.' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const deadline = new Date(data.deadline);

    if (deadline <= new Date()) {
      return NextResponse.json(
        { error: 'Application deadline must be in the future.' },
        { status: 400 }
      );
    }

    await connectDB();

    const job = await Job.create({
      ...data,
      createdBy: user.id,
      deadline,
      status: 'OPEN',
    });

    return NextResponse.json(
      {
        message: 'Placement drive created successfully.',
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST jobs error:', error);

    return NextResponse.json(
      { error: 'Unable to create placement drive.' },
      { status: 500 }
    );
  }
}
