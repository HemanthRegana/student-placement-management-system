
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import Notification from '@/models/Notification';

const allowedFields = [
  'fullName',
  'rollNumber',
  'phone',
  'department',
  'graduationYear',
  'cgpa',
  'activeBacklogs',
  'historicalBacklogs',
  'tenth',
  'twelfth',
  'tenthMarksheetUrl',
  'twelfthMarksheetUrl',
  'resumeUrl',
] as const;

const documentLinkFields = [
  'tenthMarksheetUrl',
  'twelfthMarksheetUrl',
  'resumeUrl',
] as const;

function validateString(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    return `${field} must be a non-empty string of at most ${maxLength} characters.`;
  }

  return null;
}

function validateDocumentUrl(
  value: unknown,
  field: string
): string | null {
  if (typeof value !== 'string') {
    return `${field} must be a valid URL.`;
  }

  const trimmed = value.trim();

  // Empty links are allowed when a student has not supplied a document.
  if (trimmed === '') return null;

  if (trimmed.length > 2048) {
    return `${field} URL is too long.`;
  }

  try {
    const parsedUrl = new URL(trimmed);

    if (
      parsedUrl.protocol !== 'https:' ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return `${field} must be a valid HTTPS sharing link.`;
    }
  } catch {
    return `${field} must be a valid HTTPS URL.`;
  }

  return null;
}

function validateAcademicRecord(
  value: unknown,
  field: string
): string | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return `${field} must be a valid object.`;
  }

  const record = value as Record<string, unknown>;
  const allowed = ['board', 'year', 'percentage'];

  if (Object.keys(record).some((key) => !allowed.includes(key))) {
    return `${field} contains unsupported fields.`;
  }

  if (
    record.board !== undefined &&
    record.board !== null &&
    record.board !== ''
  ) {
    const error = validateString(record.board, `${field}.board`, 100);
    if (error) return error;
  }

  if (record.year !== undefined) {
    if (
      typeof record.year !== 'number' ||
      !Number.isInteger(record.year) ||
      record.year < 1950 ||
      record.year > 2100
    ) {
      return `${field}.year must be a valid year between 1950 and 2100.`;
    }
  }

  if (record.percentage !== undefined) {
    if (
      typeof record.percentage !== 'number' ||
      !Number.isFinite(record.percentage) ||
      record.percentage < 0 ||
      record.percentage > 100
    ) {
      return `${field}.percentage must be between 0 and 100.`;
    }
  }

  return null;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student login required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const profile = await StudentProfile.findOne({
      user: session.id,
    }).lean();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Student profile GET error:', error);

    return NextResponse.json(
      { error: 'Unable to load student profile.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student login required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const existingProfile = await StudentProfile.findOne({
      user: session.id,
    });

    if (
      existingProfile &&
      (existingProfile.profileLocked === true ||
        existingProfile.profileEditAllowed === false)
    ) {
      return NextResponse.json(
        {
          error:
            'Your academic profile is locked. Contact the placement officer to request editing permission.',
        },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: 'Request body must be a valid object.' },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const unsupportedFields = Object.keys(data).filter(
      (field) =>
        !allowedFields.includes(
          field as (typeof allowedFields)[number]
        )
    );

    if (unsupportedFields.length > 0) {
      return NextResponse.json(
        { error: 'Request contains unsupported fields.' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid profile information provided.' },
        { status: 400 }
      );
    }

    // Validate personal information.
    const stringFields = [
      { field: 'fullName', max: 100 },
      { field: 'rollNumber', max: 30 },
      { field: 'department', max: 100 },
    ];

    for (const item of stringFields) {
      if (updates[item.field] !== undefined) {
        const error = validateString(
          updates[item.field],
          item.field,
          item.max
        );

        if (error) {
          return NextResponse.json({ error }, { status: 400 });
        }

        updates[item.field] = (
          updates[item.field] as string
        ).trim();
      }
    }

    if (updates.phone !== undefined) {
      if (
        typeof updates.phone !== 'string' ||
        !/^\+?[0-9\s()-]{7,20}$/.test(updates.phone.trim()) ||
        updates.phone.replace(/\D/g, '').length < 7 ||
        updates.phone.replace(/\D/g, '').length > 15
      ) {
        return NextResponse.json(
          { error: 'Please provide a valid phone number.' },
          { status: 400 }
        );
      }

      updates.phone = updates.phone.trim();
    }

    // Validate graduation year.
    if (updates.graduationYear !== undefined) {
      if (
        typeof updates.graduationYear !== 'number' ||
        !Number.isInteger(updates.graduationYear) ||
        updates.graduationYear < 2020 ||
        updates.graduationYear > 2100
      ) {
        return NextResponse.json(
          { error: 'Graduation year must be between 2020 and 2100.' },
          { status: 400 }
        );
      }
    }

    // Validate CGPA.
    if (updates.cgpa !== undefined) {
      if (
        typeof updates.cgpa !== 'number' ||
        !Number.isFinite(updates.cgpa) ||
        updates.cgpa < 0 ||
        updates.cgpa > 10
      ) {
        return NextResponse.json(
          { error: 'CGPA must be between 0 and 10.' },
          { status: 400 }
        );
      }
    }

    // Validate backlog counts.
    for (const field of ['activeBacklogs', 'historicalBacklogs']) {
      const value = updates[field];

      if (
        value !== undefined &&
        (typeof value !== 'number' ||
          !Number.isInteger(value) ||
          value < 0 ||
          value > 100)
      ) {
        return NextResponse.json(
          { error: `${field} must be a whole number between 0 and 100.` },
          { status: 400 }
        );
      }
    }

    // Validate 10th and 12th academic records.
    for (const field of ['tenth', 'twelfth']) {
      if (updates[field] !== undefined) {
        const error = validateAcademicRecord(
          updates[field],
          field
        );

        if (error) {
          return NextResponse.json({ error }, { status: 400 });
        }
      }
    }

    // Validate document-sharing links.
    for (const field of documentLinkFields) {
      if (updates[field] !== undefined) {
        const error = validateDocumentUrl(
          updates[field],
          field
        );

        if (error) {
          return NextResponse.json({ error }, { status: 400 });
        }

        updates[field] = (
          updates[field] as string
        ).trim();
      }
    }

    const savedProfile = await StudentProfile.findOneAndUpdate(
      { user: session.id },
      {
        $set: {
          ...updates,
          profileLocked: true,
          profileEditAllowed: false,
        },
        $setOnInsert: {
          user: session.id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Notify active placement officers and Super Admins.
    try {
      const staffMembers = await User.find({
        role: { $in: ['OFFICER', 'SUPER_ADMIN'] },
        isActive: true,
      }).select('_id');

      if (staffMembers.length > 0) {
        await Notification.insertMany(
          staffMembers.map((staff) => ({
            recipient: staff._id,
            title: 'Student profile submitted',
            message: `${session.name} has submitted an academic profile for verification.`,
            type: 'PROFILE_SUBMITTED',
            link: '/dashboard/students',
            createdBy: session.id,
          }))
        );
      }
    } catch (notificationError) {
      console.error(
        'Profile submission notification failed:',
        notificationError
      );
    }

    return NextResponse.json({
      message: 'Profile submitted and locked successfully.',
      profile: savedProfile,
    });
  } catch (error) {
    console.error('Student profile PUT error:', error);

    return NextResponse.json(
      { error: 'Unable to save student profile.' },
      { status: 500 }
    );
  }
}
