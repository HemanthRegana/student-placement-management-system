
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Application from '@/models/Application';
import StudentProfile from '@/models/StudentProfile';
import Notification from '@/models/Notification';
import Job from '@/models/Job';

const allowedStatuses = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'REJECTED',
] as const;

type ApplicationStatus = (typeof allowedStatuses)[number];

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const notificationDetails: Partial<
  Record<ApplicationStatus, { title: string; message: string; type: string }>
> = {
  SHORTLISTED: {
    title: 'Application shortlisted',
    message: 'Congratulations! Your application has been shortlisted.',
    type: 'APPLICATION_SHORTLISTED',
  },
  INTERVIEW: {
    title: 'Interview status updated',
    message: 'Your application has moved to the interview stage.',
    type: 'APPLICATION_INTERVIEW',
  },
  SELECTED: {
    title: 'Congratulations! You are selected',
    message: 'You have been selected for this placement drive.',
    type: 'APPLICATION_SELECTED',
  },
  REJECTED: {
    title: 'Application status updated',
    message: 'Unfortunately, your application was not selected.',
    type: 'APPLICATION_REJECTED',
  },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbSession = await mongoose.startSession();

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
        { error: 'You are not authorized to update applications.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status = body?.status;

    if (
      typeof status !== 'string' ||
      !allowedStatuses.includes(status as ApplicationStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid application status.' },
        { status: 400 }
      );
    }

    await connectDB();

    let updatedApplication: {
      id: string;
      status: ApplicationStatus;
    } | null = null;

    const notificationData: {
  current: {
    studentId: string;
    jobId: string;
    status: ApplicationStatus;
  } | null;
  } = {
  current: null,
  };

    await dbSession.withTransaction(async () => {
      const application = await Application.findById(id).session(dbSession);

      if (!application) {
        throw new ApiError('Application not found.', 404);
      }

      const previousStatus = application.status as ApplicationStatus;
      const statusChanged = previousStatus !== status;

      // Once selected, do not silently undo a placement decision.
      if (
        previousStatus === 'SELECTED' &&
        status !== 'SELECTED'
      ) {
        throw new ApiError(
          'A selected application cannot be changed to another status.',
          409
        );
      }

      if (
        status === 'SELECTED' &&
        previousStatus !== 'SELECTED'
      ) {
        const profile = await StudentProfile.findOne({
          user: application.student,
        }).session(dbSession);

        if (!profile) {
          throw new ApiError(
            'Student academic profile was not found.',
            404
          );
        }

        if (profile.placementStatus === 'PLACED') {
          throw new ApiError(
            'This student is already marked as placed through another application.',
            409
          );
        }

        profile.placementStatus = 'PLACED';
        await profile.save({ session: dbSession });
      }

      application.status = status as ApplicationStatus;
      await application.save({ session: dbSession });

      updatedApplication = {
        id: String(application._id),
        status: application.status as ApplicationStatus,
      };

      // Prepare notification only when the status actually changes.
      if (statusChanged && notificationDetails[status as ApplicationStatus]) {
        notificationData.current = {
          studentId: String(application.student),
          jobId: String(application.job),
          status: status as ApplicationStatus,
        };
      }
    });

    // Send the notification only after the transaction commits.
    const committedNotification = notificationData.current;

if (committedNotification) {
  try {
    const details =
      notificationDetails[committedNotification.status];

    const job = await Job.findById(committedNotification.jobId)
      .select('title companyName');

    if (details && job) {
      await Notification.create({
        recipient: committedNotification.studentId,
        title: details.title,
        message: `${details.message} Drive: ${job.title} at ${job.companyName}.`,
        type: details.type,
        link: '/dashboard/applications',
        createdBy: user.id,
      });
    }
  } catch (notificationError) {
    console.error(
      'Application status notification failed:',
      notificationError
    );
  }
}

    return NextResponse.json({
      message: 'Application status updated successfully.',
      application: updatedApplication,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Update application error:', error);

    return NextResponse.json(
      { error: 'Unable to update application status.' },
      { status: 500 }
    );
  } finally {
    await dbSession.endSession();
  }
}
