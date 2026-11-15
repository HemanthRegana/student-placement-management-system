
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Notification from '@/models/Notification';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID.' },
        { status: 400 }
      );
    }

    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: session.id,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    console.error('PATCH notification error:', error);

    return NextResponse.json(
      { error: 'Unable to update notification.' },
      { status: 500 }
    );
  }
}
