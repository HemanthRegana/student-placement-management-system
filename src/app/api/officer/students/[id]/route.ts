import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import Notification from '@/models/Notification';

async function notifyStudent(
  studentId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  type:
    | 'PROFILE_VERIFIED'
    | 'PROFILE_REJECTED'
    | 'PROFILE_EDIT_ALLOWED'
) {
  try {
    await Notification.create({
      recipient: studentId,
      title,
      message,
      type,
      link: '/dashboard/profile',
    });
  } catch (error) {
    console.error('Student notification creation failed:', error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid student ID.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    const allowedActions = [
      'approve',
      'reject',
      'grant-edit',
      'deactivate',
      'reactivate',
      'delete-profile',
    ];

    if (
      typeof action !== 'string' ||
      !allowedActions.includes(action)
    ) {
      return NextResponse.json(
        { error: 'Invalid action.' },
        { status: 400 }
      );
    }

    if (
      action === 'reject' &&
      (typeof reason !== 'string' || !reason.trim())
    ) {
      return NextResponse.json(
        { error: 'Please provide a rejection reason.' },
        { status: 400 }
      );
    }

    await connectDB();

    const student = await User.findOne({
      _id: id,
      role: 'STUDENT',
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 }
      );
    }

    const profile = await StudentProfile.findOne({ user: id });

    // Delete only the academic profile.
    // Preserve the student's login account and application history.
    if (action === 'delete-profile') {
      if (!profile) {
        return NextResponse.json(
          { error: 'Student academic profile does not exist.' },
          { status: 404 }
        );
      }

      await StudentProfile.deleteOne({ user: student._id });

      student.isVerified = false;
      await student.save();

      return NextResponse.json({
        message:
          'Student academic profile deleted successfully. Login account and application history have been preserved.',
      });
    }

    if (
      ['approve', 'reject', 'grant-edit'].includes(action) &&
      !profile
    ) {
      return NextResponse.json(
        { error: 'Student academic profile not found.' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      profile!.verificationStatus = 'VERIFIED';
      profile!.profileLocked = true;
      profile!.profileEditAllowed = false;
      profile!.rejectionReason = undefined;
      profile!.verifiedBy = new mongoose.Types.ObjectId(session.id);
      profile!.verifiedAt = new Date();

      student.isVerified = true;

      await profile!.save();
      await student.save();

      await notifyStudent(
        student._id,
        'Academic profile verified',
        'Congratulations! Your academic profile has been verified by the placement office.',
        'PROFILE_VERIFIED'
      );
    }

    if (action === 'reject') {
      profile!.verificationStatus = 'REJECTED';
      profile!.profileLocked = true;
      profile!.profileEditAllowed = false;
      profile!.rejectionReason = reason.trim();
      profile!.verifiedBy = new mongoose.Types.ObjectId(session.id);
      profile!.verifiedAt = new Date();

      student.isVerified = false;

      await profile!.save();
      await student.save();

      await notifyStudent(
        student._id,
        'Academic profile requires correction',
        `Your academic profile was rejected. Reason: ${reason.trim()}`,
        'PROFILE_REJECTED'
      );
    }

    if (action === 'grant-edit') {
      profile!.profileEditAllowed = true;
      profile!.profileLocked = false;
      profile!.verificationStatus = 'PENDING_VERIFICATION';
      profile!.rejectionReason = undefined;

      student.isVerified = false;

      await profile!.save();
      await student.save();

      await notifyStudent(
        student._id,
        'Profile editing permission granted',
        'The placement office has allowed you to edit and resubmit your academic profile.',
        'PROFILE_EDIT_ALLOWED'
      );
    }

    if (action === 'deactivate') {
      student.isActive = false;
      student.isVerified = false;

      if (profile) {
        profile.verificationStatus = 'INACTIVE';
        profile.profileLocked = true;
        profile.profileEditAllowed = false;
        await profile.save();
      }

      await student.save();
    }

    if (action === 'reactivate') {
      student.isActive = true;

      if (profile?.verificationStatus === 'INACTIVE') {
        profile.verificationStatus = 'PENDING_VERIFICATION';
        profile.profileLocked = true;
        profile.profileEditAllowed = false;
        await profile.save();
      }

      await student.save();
    }

    return NextResponse.json({
      message: `Student action "${action}" completed.`,
    });
  } catch (error) {
    console.error('Officer student update error:', error);

    return NextResponse.json(
      { error: 'Unable to update this student.' },
      { status: 500 }
    );
  }
}