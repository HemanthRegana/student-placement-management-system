
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
} from 'lucide-react';

type Student = {
  _id?: string;
  name?: string;
  email?: string;
  rollNumber?: string;
};

type Job = {
  _id?: string;
  title?: string;
  companyName?: string;
  packageLpa?: number;
};

type App = {
  _id: string;
  status: string;
  createdAt: string;
  student?: Student;
  job?: Job;
};

type Role = 'STUDENT' | 'OFFICER' | 'SUPER_ADMIN' | 'COMPANY';

const statuses = [
  'ALL',
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'REJECTED',
];

const statusStyles: Record<string, string> = {
  APPLIED: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  INTERVIEW: 'bg-amber-50 text-amber-700',
  SELECTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [message, setMessage] = useState('Loading applications…');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busy, setBusy] = useState('');

  const isOfficer = role === 'OFFICER' || role === 'SUPER_ADMIN';

  const loadApplications = useCallback(async () => {
    try {
      setMessage('Loading applications…');

      const response = await fetch('/api/applications');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load applications.');
      }

      setApps(data.applications || []);
      setRole(data.role || null);

      setMessage(
        data.applications?.length
          ? ''
          : 'No applications found yet.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load applications.'
      );
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function updateStatus(
    applicationId: string,
    status: string
  ) {
    const actionText =
      status === 'SELECTED'
        ? 'select this student'
        : status.toLowerCase();

    if (!window.confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    setBusy(applicationId);
    setMessage('');

    try {
      const response = await fetch(
        `/api/officer/applications/${applicationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update application.');
      }

      setApps((previous) =>
        previous.map((app) =>
          app._id === applicationId
            ? { ...app, status }
            : app
        )
      );

      setMessage(data.message || 'Application updated successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update application.'
      );
    } finally {
      setBusy('');
    }
  }

  const filteredApps = apps.filter((app) => {
    const studentName = app.student?.name || '';
    const email = app.student?.email || '';
    const rollNumber = app.student?.rollNumber || '';
    const jobTitle = app.job?.title || '';
    const company = app.job?.companyName || '';

    const searchText = [
      studentName,
      email,
      rollNumber,
      jobTitle,
      company,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesFilter =
      filter === 'ALL' || app.status === filter;

    return matchesSearch && matchesFilter;
  });

  const count = (status: string) =>
    apps.filter((app) => app.status === status).length;

  return (
    <>
      <p className="text-sm font-medium text-blue-600">
        Workspace / Applications
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Applications
          </h1>

          <p className="mt-2 text-slate-500">
            {isOfficer
              ? 'Review applicants and manage placement progress.'
              : 'Track the progress of your placement applications.'}
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {isOfficer && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total', value: apps.length, icon: ClipboardList },
            { label: 'Applied', value: count('APPLIED'), icon: Clock },
            { label: 'Shortlisted', value: count('SHORTLISTED'), icon: Users },
            { label: 'Interview', value: count('INTERVIEW'), icon: ClipboardList },
            { label: 'Selected', value: count('SELECTED'), icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {item.label}
                  </p>
                  <Icon size={19} className="text-blue-600" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              isOfficer
                ? 'Search student, roll number, company or role...'
                : 'Search company or role...'
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All statuses' : status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filteredApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {isOfficer && (
                    <th className="px-5 py-4">Student</th>
                  )}

                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Package</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Applied</th>

                  {isOfficer && (
                    <th className="px-5 py-4">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app._id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    {isOfficer && (
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {app.student?.name || 'Unknown student'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {app.student?.rollNumber || app.student?.email || '—'}
                        </p>
                      </td>
                    )}

                    <td className="px-5 py-4 font-semibold">
                      {app.job?.title || 'Removed drive'}
                    </td>

                    <td className="px-5 py-4">
                      {app.job?.companyName || '—'}
                    </td>

                    <td className="px-5 py-4">
                      {app.job?.packageLpa
                        ? `${app.job.packageLpa} LPA`
                        : '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[app.status] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>

                    {isOfficer && (
                      <td className="px-5 py-4">
                        {app.status === 'SELECTED' ? (
                          <span className="text-xs font-semibold text-emerald-700">
                            Student placed
                          </span>
                        ) : app.status === 'REJECTED' ? (
                          <span className="text-xs text-slate-500">
                            Rejected
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {app.status === 'APPLIED' && (
                              <button
                                disabled={!!busy}
                                onClick={() =>
                                  updateStatus(app._id, 'SHORTLISTED')
                                }
                                className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 disabled:opacity-50"
                              >
                                Shortlist
                              </button>
                            )}

                            {(app.status === 'APPLIED' ||
                              app.status === 'SHORTLISTED') && (
                              <button
                                disabled={!!busy}
                                onClick={() =>
                                  updateStatus(app._id, 'INTERVIEW')
                                }
                                className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                              >
                                Interview
                              </button>
                            )}

                            <button
                              disabled={!!busy}
                              onClick={() =>
                                updateStatus(app._id, 'SELECTED')
                              }
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                            >
                              Select
                            </button>

                            <button
                              disabled={!!busy}
                              onClick={() =>
                                updateStatus(app._id, 'REJECTED')
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>

                            {busy === app._id && (
                              <span className="text-xs text-slate-400">
                                Updating…
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <ClipboardList
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              No applications found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
