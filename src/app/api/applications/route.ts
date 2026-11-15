
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Application from '@/models/Application';
import Job from '@/models/Job';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      );
    }

    if (!['STUDENT', 'OFFICER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'You are not allowed to view applications.' },
        { status: 403 }
      );
    }

    await connectDB();

    const filter =
      user.role === 'STUDENT' ? { student: user.id } : {};

    const applications = await Application.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('job', 'title companyName packageLpa deadline status')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      applications,
      role: user.role,
    });
  } catch (error) {
    console.error('GET applications error:', error);

    return NextResponse.json(
      { error: 'Unable to load applications.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      );
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can apply.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const jobId = body?.jobId;

    if (
      typeof jobId !== 'string' ||
      !mongoose.isValidObjectId(jobId)
    ) {
      return NextResponse.json(
        { error: 'A valid job ID is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const [student, profile, job] = await Promise.all([
      User.findById(user.id),
      StudentProfile.findOne({ user: user.id }),
      Job.findById(jobId),
    ]);

    if (!student || student.role !== 'STUDENT' || !student.isActive) {
      return NextResponse.json(
        { error: 'Your student account is inactive or unavailable.' },
        { status: 403 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Please complete your academic profile first.' },
        { status: 403 }
      );
    }

    if (
      profile.verificationStatus !== 'VERIFIED' ||
      student.isVerified !== true
    ) {
      return NextResponse.json(
        { error: 'Your academic profile must be verified before applying.' },
        { status: 403 }
      );
    }

    if (profile.placementStatus !== 'ACTIVE_PLACEMENT') {
      return NextResponse.json(
        {
          error:
            'You are already marked as placed and cannot apply to more drives.',
        },
        { status: 403 }
      );
    }

    if (!job || job.status !== 'OPEN' || job.deadline < new Date()) {
      return NextResponse.json(
        { error: 'This placement drive is no longer open.' },
        { status: 404 }
      );
    }

    // Verify academic data before checking eligibility.
    if (
      typeof profile.cgpa !== 'number' ||
      typeof profile.activeBacklogs !== 'number' ||
      !profile.department ||
      typeof profile.graduationYear !== 'number'
    ) {
      return NextResponse.json(
        {
          error:
            'Your verified academic profile is incomplete. Contact the placement office.',
        },
        { status: 403 }
      );
    }

    const meetsCgpa = profile.cgpa >= job.minCgpa;
    const meetsBacklogs = profile.activeBacklogs <= job.maxBacklogs;

    const meetsDepartment =
      !job.eligibleDepartments?.length ||
      job.eligibleDepartments.includes(profile.department);

    const meetsGraduationYear =
      !job.graduationYear ||
      job.graduationYear === profile.graduationYear;

    if (
      !meetsCgpa ||
      !meetsBacklogs ||
      !meetsDepartment ||
      !meetsGraduationYear
    ) {
      return NextResponse.json(
        {
          error:
            'Your academic profile does not meet this drive’s eligibility criteria.',
        },
        { status: 403 }
      );
    }

    // Create the application first.
    const application = await Application.create({
      student: user.id,
      job: jobId,
    });

    // Notify active placement staff.
    // Notification failure must not undo a successful application.
    try {
      const staffMembers = await User.find({
        role: { $in: ['OFFICER', 'SUPER_ADMIN'] },
        isActive: true,
      }).select('_id');

      if (staffMembers.length > 0) {
        await Notification.insertMany(
          staffMembers.map((staff) => ({
            recipient: staff._id,
            title: 'New placement application',
            message: `${student.name} (${student.email}) applied for ${job.title} at ${job.companyName}.`,
            type: 'APPLICATION_SUBMITTED',
            link: '/dashboard/applications',
            createdBy: student._id,
          }))
        );
      }
    } catch (notificationError) {
      console.error(
        'Application submission notification failed:',
        notificationError
      );
    }

    return NextResponse.json(
      {
        message: 'Application submitted successfully.',
        application,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const mongoError = error as { code?: number };

    if (mongoError.code === 11000) {
      return NextResponse.json(
        { error: 'You have already applied to this drive.' },
        { status: 409 }
      );
    }

    console.error('POST application error:', error);

    return NextResponse.json(
      { error: 'Unable to submit your application.' },
      { status: 500 }
    );
  }
}
