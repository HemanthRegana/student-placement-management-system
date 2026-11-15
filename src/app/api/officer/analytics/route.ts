
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import Job from '@/models/Job';
import Application from '@/models/Application';

export async function GET() {
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
        { error: 'Only placement officers can access analytics.' },
        { status: 403 }
      );
    }

    await connectDB();

    const [
      totalStudents,
      verifiedStudents,
      pendingStudents,
      rejectedProfiles,
      placedStudents,
      totalDrives,
      openDrives,
      totalApplications,
      appliedCount,
      shortlistedCount,
      interviewCount,
      selectedCount,
      rejectedCount,
      companyStats,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),

      StudentProfile.countDocuments({
        verificationStatus: 'VERIFIED',
      }),

      StudentProfile.countDocuments({
        verificationStatus: 'PENDING_VERIFICATION',
      }),

      StudentProfile.countDocuments({
        verificationStatus: 'REJECTED',
      }),

      StudentProfile.countDocuments({
        placementStatus: 'PLACED',
      }),

      Job.countDocuments(),

      Job.countDocuments({
        status: 'OPEN',
        deadline: { $gte: new Date() },
      }),

      Application.countDocuments(),

      Application.countDocuments({ status: 'APPLIED' }),

      Application.countDocuments({ status: 'SHORTLISTED' }),

      Application.countDocuments({ status: 'INTERVIEW' }),

      Application.countDocuments({ status: 'SELECTED' }),

      Application.countDocuments({ status: 'REJECTED' }),

      Application.aggregate([
        {
          $match: {
            status: 'SELECTED',
          },
        },
        {
          $lookup: {
            from: Job.collection.name,
            localField: 'job',
            foreignField: '_id',
            as: 'jobDetails',
          },
        },
        {
          $unwind: '$jobDetails',
        },
        {
          $group: {
            _id: '$jobDetails.companyName',
            selectedStudents: { $sum: 1 },
            averagePackage: { $avg: '$jobDetails.packageLpa' },
            highestPackage: { $max: '$jobDetails.packageLpa' },
          },
        },
        {
          $sort: {
            selectedStudents: -1,
          },
        },
      ]),
    ]);

    const placementPercentage =
      verifiedStudents > 0
        ? Number(((placedStudents / verifiedStudents) * 100).toFixed(2))
        : 0;

    const selectedPackages = await Application.aggregate([
      {
        $match: {
          status: 'SELECTED',
        },
      },
      {
        $lookup: {
          from: Job.collection.name,
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails',
        },
      },
      {
        $unwind: '$jobDetails',
      },
      {
        $group: {
          _id: null,
          averagePackage: {
            $avg: '$jobDetails.packageLpa',
          },
          highestPackage: {
            $max: '$jobDetails.packageLpa',
          },
        },
      },
    ]);

    const packageSummary = selectedPackages[0] || {
      averagePackage: 0,
      highestPackage: 0,
    };

    return NextResponse.json({
      students: {
        total: totalStudents,
        verified: verifiedStudents,
        pending: pendingStudents,
        rejected: rejectedProfiles,
        placed: placedStudents,
        notPlaced: Math.max(verifiedStudents - placedStudents, 0),
      },

      drives: {
        total: totalDrives,
        open: openDrives,
        closed: totalDrives - openDrives,
      },

      applications: {
        total: totalApplications,
        applied: appliedCount,
        shortlisted: shortlistedCount,
        interview: interviewCount,
        selected: selectedCount,
        rejected: rejectedCount,
      },

      placement: {
        percentage: placementPercentage,
        averagePackage: Number(
          (packageSummary.averagePackage || 0).toFixed(2)
        ),
        highestPackage: packageSummary.highestPackage || 0,
      },

      companies: companyStats.map((company) => ({
        name: company._id,
        selectedStudents: company.selectedStudents,
        averagePackage: Number(
          company.averagePackage.toFixed(2)
        ),
        highestPackage: company.highestPackage,
      })),
    });
  } catch (error) {
    console.error('Placement analytics error:', error);

    return NextResponse.json(
      { error: 'Unable to load placement analytics.' },
      { status: 500 }
    );
  }
}
