
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/auth';

import StudentProfile from '@/models/StudentProfile';
import Application from '@/models/Application';
import Job from '@/models/Job';

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
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Include the current month and previous 11 months.
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMonth(startDate.getMonth() - 11);

    const [
      departmentStats,
      graduationYearStats,
      monthlyTrends,
      companyStats,
    ] = await Promise.all([

      // Department-wise placement statistics.
      StudentProfile.aggregate([
        {
          $match: {
            verificationStatus: 'VERIFIED',
            department: { $exists: true, $nin: ['', null] },
          },
        },
        {
          $group: {
            _id: '$department',
            verifiedStudents: { $sum: 1 },
            placedStudents: {
              $sum: {
                $cond: [
                  { $eq: ['$placementStatus', 'PLACED'] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            department: '$_id',
            verifiedStudents: 1,
            placedStudents: 1,
            placementPercentage: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        '$placedStudents',
                        '$verifiedStudents',
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { department: 1 } },
      ]),

      // Graduation-year placement statistics.
      StudentProfile.aggregate([
        {
          $match: {
            verificationStatus: 'VERIFIED',
            graduationYear: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$graduationYear',
            verifiedStudents: { $sum: 1 },
            placedStudents: {
              $sum: {
                $cond: [
                  { $eq: ['$placementStatus', 'PLACED'] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            graduationYear: '$_id',
            verifiedStudents: 1,
            placedStudents: 1,
            placementPercentage: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        '$placedStudents',
                        '$verifiedStudents',
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { graduationYear: 1 } },
      ]),

      // Monthly applications and selections.
      Application.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$createdAt',
                timezone: 'Asia/Kolkata',
              },
            },
            applications: { $sum: 1 },
            selected: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'SELECTED'] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            month: '$_id',
            applications: 1,
            selected: 1,
          },
        },
        { $sort: { month: 1 } },
      ]),

      // Company package comparison from selected applications.
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
        { $unwind: '$jobDetails' },
        {
          $group: {
            _id: '$jobDetails.companyName',
            selectedApplications: { $sum: 1 },
            averagePackage: {
              $avg: '$jobDetails.packageLpa',
            },
            highestPackage: {
              $max: '$jobDetails.packageLpa',
            },
          },
        },
        {
          $project: {
            _id: 0,
            company: '$_id',
            selectedApplications: 1,
            averagePackage: {
              $round: ['$averagePackage', 2],
            },
            highestPackage: 1,
          },
        },
        { $sort: { highestPackage: -1 } },
      ]),
    ]);

    return NextResponse.json({
      departments: departmentStats,
      graduationYears: graduationYearStats,
      monthlyTrends,
      companies: companyStats,
    });

  } catch (error) {
    console.error('Detailed analytics error:', error);

    return NextResponse.json(
      { error: 'Unable to load detailed analytics.' },
      { status: 500 }
    );
  }
}
