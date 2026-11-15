
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 }
      );
    }

if (!['OFFICER', 'SUPER_ADMIN'].includes(session.role)) {
        return NextResponse.json(
        { error: 'Officer access required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const students = await User.find({ role: 'STUDENT' })
      .select('name email rollNumber department graduationYear cgpa backlogs isVerified isActive')
      .sort({ name: 1 })
      .lean();

    const profiles = await StudentProfile.find({
      user: { $in: students.map((student) => student._id) },
    }).lean();

    const profileByUser = new Map(
      profiles.map((profile) => [profile.user.toString(), profile])
    );

    const results = students.map((student: any) => ({
  ...student,
  profile: profileByUser.get(String(student._id)) ?? null,
}));
    return NextResponse.json({ students: results });
  } catch (error) {
    console.error('Officer student list error:', error);

    return NextResponse.json(
      { error: 'Unable to load students.' },
      { status: 500 }
    );
  }
}
