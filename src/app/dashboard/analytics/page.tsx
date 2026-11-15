'use client';

import { useCallback, useEffect, useState } from 'react';
import AdvancedAnalytics from './AdvancedAnalytics';
import { autoTable } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';

type Analytics = {
  students: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    placed: number;
    notPlaced: number;
  };
  drives: {
    total: number;
    open: number;
    closed: number;
  };
  applications: {
    total: number;
    applied: number;
    shortlisted: number;
    interview: number;
    selected: number;
    rejected: number;
  };
  placement: {
    percentage: number;
    averagePackage: number;
    highestPackage: number;
  };
  companies: {
    name: string;
    selectedStudents: number;
    averagePackage: number;
    highestPackage: number;
  }[];
};

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">
          {value}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/officer/analytics', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics.');
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const exportCSV = () => {
    if (!data) return;

    const rows = [
      ['CampusFlow Placement Analytics', ''],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['STUDENT METRICS', 'Count'],
      ['Registered Students', data.students.total],
      ['Verified Students', data.students.verified],
      ['Pending Profiles', data.students.pending],
      ['Rejected Profiles', data.students.rejected],
      ['Placed Students', data.students.placed],
      ['Verified Students Not Placed', data.students.notPlaced],
      [],
      ['DRIVE METRICS', 'Count'],
      ['Total Drives', data.drives.total],
      ['Open Drives', data.drives.open],
      ['Closed Drives', data.drives.closed],
      [],
      ['APPLICATION METRICS', 'Count'],
      ['Total Applications', data.applications.total],
      ['Applied', data.applications.applied],
      ['Shortlisted', data.applications.shortlisted],
      ['Interview', data.applications.interview],
      ['Selected', data.applications.selected],
      ['Rejected', data.applications.rejected],
      [],
      ['PLACEMENT METRICS', 'Value'],
      ['Placement Rate (%)', data.placement.percentage],
      ['Average Package (LPA)', data.placement.averagePackage],
      ['Highest Package (LPA)', data.placement.highestPackage],
      [],
      ['COMPANY', 'SELECTED', 'AVERAGE PACKAGE (LPA)', 'HIGHEST PACKAGE (LPA)'],
      ...data.companies.map((company) => [
        company.name,
        company.selectedStudents,
        company.averagePackage,
        company.highestPackage,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'campusflow-placement-analytics.csv';
    link.click();

    URL.revokeObjectURL(url);
  };
   
 const exportPDF = () => {
  if (!data) return;

  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString('en-IN');

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(23);
  doc.setFont('helvetica', 'bold');
  doc.text('CAMPUSFLOW', 14, 17);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Placement Analytics Report', 14, 27);

  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, 14, 44);

  // Student metrics
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Student Overview', 14, 57);

  autoTable(doc, {
    startY: 62,
    head: [['Metric', 'Count']],
    body: [
      ['Registered Students', String(data.students.total)],
      ['Verified Students', String(data.students.verified)],
      ['Pending Profiles', String(data.students.pending)],
      ['Rejected Profiles', String(data.students.rejected)],
      ['Placed Students', String(data.students.placed)],
      ['Verified Students Not Placed', String(data.students.notPlaced)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Drive metrics
  let y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.text('2. Placement Drives', 14, y);

 autoTable(doc, {
    startY: y + 5,
    head: [['Metric', 'Count']],
    body: [
      ['Total Drives', String(data.drives.total)],
      ['Open Drives', String(data.drives.open)],
      ['Closed Drives', String(data.drives.closed)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Application metrics
  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.text('3. Application Statistics', 14, y);

  autoTable(doc, {
    startY: y + 5,
    head: [['Application Status', 'Count']],
    body: [
      ['Total Applications', String(data.applications.total)],
      ['Applied', String(data.applications.applied)],
      ['Shortlisted', String(data.applications.shortlisted)],
      ['Interview', String(data.applications.interview)],
      ['Selected', String(data.applications.selected)],
      ['Rejected', String(data.applications.rejected)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Package overview
  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.text('4. Placement Package Overview', 14, y);

  autoTable(doc, {
    startY: y + 5,
    head: [['Metric', 'Value']],
    body: [
      ['Placement Rate', `${data.placement.percentage}%`],
      ['Average Package', `${data.placement.averagePackage} LPA`],
      ['Highest Package', `${data.placement.highestPackage} LPA`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Company statistics
  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(14);
  doc.text('5. Company-wise Placement Statistics', 14, y);

  autoTable(doc, {
    startY: y + 5,
    head: [[
      'Company',
      'Selected',
      'Average Package',
      'Highest Package',
    ]],
    body: data.companies.map((company) => [
      company.name,
      String(company.selectedStudents),
      `${company.averagePackage} LPA`,
      `${company.highestPackage} LPA`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'CampusFlow | Confidential Placement Report',
      14,
      pageHeight - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      196,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  doc.save('CampusFlow-Placement-Analytics.pdf');
  };

   

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading placement analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Unable to load analytics
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            CAMPUSFLOW / REPORTS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Placement Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor student placements, applications and company performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadAnalytics}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
          <button
            onClick={exportCSV}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ↓ Export CSV
          </button>
          <button
           onClick={exportPDF}
           className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
           >
          ↓ Export PDF
         </button>
        </div>
      </div>

      {/* Student metrics */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Student Overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Registered Students"
            value={data.students.total}
            subtitle="All student accounts"
          />
          <MetricCard
            title="Verified Students"
            value={data.students.verified}
            subtitle="Approved academic profiles"
          />
          <MetricCard
            title="Placed Students"
            value={data.students.placed}
            subtitle="Marked as placed"
          />
          <MetricCard
            title="Placement Rate"
            value={`${data.placement.percentage}%`}
            subtitle="Placed / verified students"
          />
        </div>
      </section>

      {/* Drive and application metrics */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Drives & Applications
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Drives"
            value={data.drives.total}
            subtitle="All placement drives"
          />
          <MetricCard
            title="Open Drives"
            value={data.drives.open}
            subtitle="Currently open and not expired"
          />
          <MetricCard
            title="Total Applications"
            value={data.applications.total}
            subtitle="Applications submitted"
          />
          <MetricCard
            title="Selected Applications"
            value={data.applications.selected}
            subtitle="Applications marked selected"
          />
        </div>
      </section>

      {/* Placement performance */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Application Status
          </h2>
          <p className="mb-6 mt-1 text-sm text-gray-500">
            Distribution of application statuses
          </p>

          <div className="space-y-5">
            <ProgressRow
              label="Applied"
              value={data.applications.applied}
              total={data.applications.total}
            />
            <ProgressRow
              label="Shortlisted"
              value={data.applications.shortlisted}
              total={data.applications.total}
            />
            <ProgressRow
              label="Interview"
              value={data.applications.interview}
              total={data.applications.total}
            />
            <ProgressRow
              label="Selected"
              value={data.applications.selected}
              total={data.applications.total}
            />
            <ProgressRow
              label="Rejected"
              value={data.applications.rejected}
              total={data.applications.total}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Package Overview
          </h2>
          <p className="mb-6 mt-1 text-sm text-gray-500">
            Package figures from selected applications
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-blue-700">Average Package</p>
              <p className="mt-3 text-3xl font-bold text-blue-900">
                ₹{data.placement.averagePackage}
              </p>
              <p className="mt-1 text-xs text-blue-700">LPA</p>
            </div>

            <div className="rounded-xl bg-purple-50 p-5">
              <p className="text-sm text-purple-700">Highest Package</p>
              <p className="mt-3 text-3xl font-bold text-purple-900">
                ₹{data.placement.highestPackage}
              </p>
              <p className="mt-1 text-xs text-purple-700">LPA</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Verified students placed
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {data.students.placed} / {data.students.verified}
            </p>
          </div>
        </div>
      </section>

      {/* Company performance */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Company-wise Placement Statistics
        </h2>
        <p className="mb-5 mt-1 text-sm text-gray-500">
          Companies with selected applications
        </p>

        {data.companies.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No selected applications available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Selected</th>
                  <th className="px-4 py-3 font-semibold">Average Package</th>
                  <th className="px-4 py-3 font-semibold">Highest Package</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company) => (
                  <tr
                    key={company.name}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold capitalize text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {company.selectedStudents}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      ₹{company.averagePackage} LPA
                    </td>
                    <td className="px-4 py-4 font-semibold text-green-700">
                      ₹{company.highestPackage} LPA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Verification overview */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Student Verification Overview
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">Verified</p>
            <p className="mt-2 text-2xl font-bold text-green-800">
              {data.students.verified}
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="mt-2 text-2xl font-bold text-yellow-800">
              {data.students.pending}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">Rejected</p>
            <p className="mt-2 text-2xl font-bold text-red-800">
              {data.students.rejected}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Verification figures count student profiles. Accounts without a
          profile or with another verification status may not appear in
          these categories.
        </p>
            </section>

      <AdvancedAnalytics />
    </main>
  );
}