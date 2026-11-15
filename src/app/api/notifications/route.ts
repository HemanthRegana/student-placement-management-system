import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get('page')) || 1
    );
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = { recipient: session.id };

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments({
        ...filter,
        isRead: false,
      }),

      Notification.countDocuments(filter),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET notifications error:', error);

    return NextResponse.json(
      { error: 'Unable to load notifications.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['OFFICER', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Only placement staff can create notifications.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const recipientId = String(body.recipientId || '');
    const title = String(body.title || '').trim();
    const message = String(body.message || '').trim();
    const type = String(body.type || 'SYSTEM');
    const link = String(body.link || '/dashboard').trim();

    const allowedTypes = [
      'PROFILE_SUBMITTED',
      'PROFILE_VERIFIED',
      'PROFILE_REJECTED',
      'PROFILE_EDIT_ALLOWED',
      'NEW_PLACEMENT_DRIVE',
      'APPLICATION_SUBMITTED',
      'APPLICATION_SHORTLISTED',
      'APPLICATION_INTERVIEW',
      'APPLICATION_SELECTED',
      'APPLICATION_REJECTED',
      'STUDENT_REGISTERED',
      'SYSTEM',
    ];

    if (!mongoose.isValidObjectId(recipientId)) {
      return NextResponse.json(
        { error: 'Invalid recipient ID.' },
        { status: 400 }
      );
    }

    if (!title || title.length > 120 || !message || message.length > 500) {
      return NextResponse.json(
        { error: 'Title or message is invalid.' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type.' },
        { status: 400 }
      );
    }

    if (
      !link.startsWith('/') ||
      link.startsWith('//') ||
      link.includes('\\')
    ) {
      return NextResponse.json(
        { error: 'Invalid notification link.' },
        { status: 400 }
      );
    }

    const recipient = await User.findById(recipientId)
      .select('_id role isActive')
      .exec();

    if (!recipient || recipient.role !== 'STUDENT' || !recipient.isActive) {
      return NextResponse.json(
        { error: 'Active student recipient not found.' },
        { status: 404 }
      );
    }

    const notification = await Notification.create({
      recipient: recipient._id,
      title,
      message,
      type,
      link,
      createdBy: session.id,
    });

    return NextResponse.json(
      {
        message: 'Notification created successfully.',
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST notification error:', error);

    return NextResponse.json(
      { error: 'Unable to create notification.' },
      { status: 500 }
    );
  }
}
