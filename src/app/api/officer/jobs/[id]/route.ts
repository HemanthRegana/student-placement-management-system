
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Job from '@/models/Job';

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  companyName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  location: z.string().trim().max(200).optional(),
  packageLpa: z.number().positive().max(10000).optional(),
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().int().min(0).max(100).optional(),
  eligibleDepartments: z.array(z.string().trim().min(1)).optional(),
  graduationYear: z.number().int().min(2020).max(2100).nullable().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required.',
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only placement officers can manage drives.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid placement drive ID.' },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update details.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.deadline && new Date(data.deadline) <= new Date()) {
      return NextResponse.json(
        { error: 'The application deadline must be in the future.' },
        { status: 400 }
      );
    }

    await connectDB();

    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Placement drive not found.' },
        { status: 404 }
      );
    }

    // A drive cannot be reopened after its deadline.
    if (
      data.status === 'OPEN' &&
      job.deadline <= new Date() &&
      !data.deadline
    ) {
      return NextResponse.json(
        { error: 'Set a future deadline before reopening this drive.' },
        { status: 400 }
      );
    }

    Object.assign(job, {
      ...data,
      ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
      ...(data.graduationYear === null
        ? { graduationYear: undefined }
        : {}),
    });

    await job.save();

    return NextResponse.json({
      message: 'Placement drive updated successfully.',
      job,
    });
  } catch (error) {
    console.error('PATCH officer job error:', error);

    return NextResponse.json(
      { error: 'Unable to update placement drive.' },
      { status: 500 }
    );
  }
}
