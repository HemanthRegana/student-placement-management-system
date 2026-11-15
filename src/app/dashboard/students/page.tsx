
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Unlock,
  UserX,
  UserCheck,
  ExternalLink,
  GraduationCap,
  Trash2,
} from 'lucide-react';

type StudentProfile = {
  fullName?: string;
  rollNumber?: string;
  phone?: string;
  department?: string;
  graduationYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  historicalBacklogs?: number;
  tenth?: {
    board?: string;
    year?: number;
    percentage?: number;
  };
  twelfth?: {
    board?: string;
    year?: number;
    percentage?: number;
  };
  documents?: {
    _id?: string;
    type: string;
    url: string;
    uploadedAt?: string;
    verified?: boolean;
  }[];
  verificationStatus?: string;
  placementStatus?: string;
  profileLocked?: boolean;
  profileEditAllowed?: boolean;
  rejectionReason?: string;
};

type Student = {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  department?: string;
  graduationYear?: number;
  cgpa?: number;
  backlogs?: number;
  isVerified: boolean;
  isActive: boolean;
  profile: StudentProfile | null;
};

type StudentAction =
  | 'approve'
  | 'reject'
  | 'grant-edit'
  | 'deactivate'
  | 'reactivate'
  | 'delete-profile';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/officer/students', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load students.');
      }

      const records: Student[] = data.students || [];
      setStudents(records);

      setSelected((previous) =>
        previous
          ? records.find((student) => student._id === previous._id) || null
          : null
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load students.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  async function performAction(
    action: StudentAction,
    student: Student,
    reason?: string
  ) {
    if (working) return;

    setWorking(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `/api/officer/students/${student._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Student action failed.');
      }

      setMessage(data.message || 'Student updated successfully.');

      await loadStudents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update student.'
      );
    } finally {
      setWorking(false);
    }
  }

  function handleAction(action: StudentAction, student: Student) {
    let reason: string | undefined;

    if (action === 'reject') {
      reason = window
        .prompt('Enter the reason for rejecting this profile:')
        ?.trim();

      if (!reason) {
        setError('A rejection reason is required.');
        return;
      }
    }

    if (action === 'deactivate') {
      if (!window.confirm(`Deactivate ${student.name}'s account?`)) return;
    }

    if (action === 'reactivate') {
      if (!window.confirm(`Reactivate ${student.name}'s account?`)) return;
    }

    if (action === 'grant-edit') {
      if (
        !window.confirm(
          `Allow ${student.name} to edit their profile again?`
        )
      ) {
        return;
      }
    }

    if (action === 'approve') {
      if (
        !window.confirm(
          `Approve ${student.name}'s academic profile?`
        )
      ) {
        return;
      }
    }

    if (action === 'delete-profile') {
      if (!student.profile) {
        setError('This student does not have an academic profile.');
        return;
      }

      const confirmed = window.confirm(
        `WARNING: Permanently delete ${student.name}'s academic profile?\n\n` +
          'This action cannot be undone.\n\n' +
          'The student login account and placement application history will remain.'
      );

      if (!confirmed) return;
    }

    performAction(action, student, reason);
  }

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase();

    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      (student.profile?.rollNumber || student.rollNumber || '')
        .toLowerCase()
        .includes(query)
    );
  });

  const pendingCount = students.filter(
    (s) => s.profile?.verificationStatus === 'PENDING_VERIFICATION'
  ).length;

  const verifiedCount = students.filter(
    (s) => s.profile?.verificationStatus === 'VERIFIED'
  ).length;

  const rejectedCount = students.filter(
    (s) => s.profile?.verificationStatus === 'REJECTED'
  ).length;

  const statusClass: Record<string, string> = {
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700',
    VERIFIED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    INACTIVE: 'bg-slate-100 text-slate-600',
    'NO PROFILE': 'bg-slate-100 text-slate-600',
  };

  const profile = selected?.profile;

  return (
    <div className="space-y-7">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Workspace / Student Verification
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Student Management
          </h1>

          <p className="mt-2 text-slate-500">
            Review academic records and manage student verification.
          </p>
        </div>

        <button
          onClick={loadStudents}
          disabled={loading || working}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total students', value: students.length },
          { label: 'Pending verification', value: pendingCount },
          { label: 'Verified profiles', value: verifiedCount },
          { label: 'Rejected profiles', value: rejectedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* STUDENT DIRECTORY */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold">Student directory</h2>

            <div className="relative mt-4">
              <Search
                size={17}
                className="absolute left-3 top-3.5 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email or roll number"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">
                Loading students...
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                No matching students found.
              </p>
            ) : (
              filteredStudents.map((student) => {
                const status =
                  student.profile?.verificationStatus || 'NO PROFILE';

                return (
                  <button
                    key={student._id}
                    onClick={() => setSelected(student)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-blue-50 ${
                      selected?._id === student._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {student.profile?.fullName || student.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {student.email}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.profile?.rollNumber ||
                            student.rollNumber ||
                            'No roll number'}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          statusClass[status] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* STUDENT DETAILS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-3">
          {!selected ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <GraduationCap size={40} className="text-slate-300" />

              <h2 className="mt-4 font-bold">Select a student</h2>

              <p className="mt-2 text-sm text-slate-500">
                Select a student from the directory to review their details.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* STUDENT HEADER */}
              <div>
                <h2 className="text-xl font-bold">
                  {profile?.fullName || selected.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selected.email}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Account: {selected.isActive ? 'Active' : 'Deactivated'}
                </p>
              </div>

              {/* PERSONAL INFORMATION */}
              <div>
                <h3 className="mb-3 font-bold">
                  Personal information
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <Detail
                    label="Roll number"
                    value={profile?.rollNumber || selected.rollNumber}
                  />

                  <Detail label="Phone" value={profile?.phone} />

                  <Detail
                    label="Department"
                    value={profile?.department || selected.department}
                  />

                  <Detail
                    label="Graduation year"
                    value={
                      profile?.graduationYear || selected.graduationYear
                    }
                  />
                </div>
              </div>

              {/* COLLEGE ACADEMICS */}
              <div>
                <h3 className="mb-3 font-bold">
                  College academics
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <Detail
                    label="CGPA / CPI"
                    value={profile?.cgpa ?? selected.cgpa}
                  />

                  <Detail
                    label="Active backlogs"
                    value={profile?.activeBacklogs}
                  />

                  <Detail
                    label="Historical backlogs"
                    value={profile?.historicalBacklogs}
                  />

                  <Detail
                    label="Placement status"
                    value={profile?.placementStatus}
                  />
                </div>
              </div>

              {/* SCHOOL ACADEMICS */}
              <div>
                <h3 className="mb-3 font-bold">
                  School academics
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <Detail
                    label="10th board"
                    value={profile?.tenth?.board}
                  />

                  <Detail
                    label="10th year"
                    value={profile?.tenth?.year}
                  />

                  <Detail
                    label="10th percentage"
                    value={profile?.tenth?.percentage}
                  />

                  <Detail
                    label="12th / Diploma board"
                    value={profile?.twelfth?.board}
                  />

                  <Detail
                    label="12th / Diploma year"
                    value={profile?.twelfth?.year}
                  />

                  <Detail
                    label="12th / Diploma percentage"
                    value={profile?.twelfth?.percentage}
                  />
                </div>
              </div>

              {/* UPLOADED DOCUMENTS */}
              <div>
                <h3 className="mb-3 font-bold">
                  Uploaded documents
                </h3>

                {profile?.documents?.length ? (
                  <div className="space-y-2">
                    {profile.documents.map((document, index) => (
                      <div
                        key={document._id || index}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {document.type.replaceAll('_', ' ')}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {document.verified
                              ? 'Verified'
                              : 'Not verified'}
                          </p>
                        </div>

                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                        >
                          View document <ExternalLink size={15} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No documents uploaded.
                  </p>
                )}
              </div>

              {/* REJECTION REASON */}
              {profile?.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-800">
                    Previous rejection reason
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {profile.rejectionReason}
                  </p>
                </div>
              )}

              {/* VERIFICATION ACTIONS */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="mb-4 font-bold">
                  Verification actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  {/* APPROVE */}
                  <button
                    disabled={
                      working ||
                      !profile ||
                      !selected.isActive ||
                      profile.verificationStatus === 'VERIFIED'
                    }
                    onClick={() => handleAction('approve', selected)}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>

                  {/* REJECT */}
                  <button
                    disabled={
                      working ||
                      !profile ||
                      !selected.isActive ||
                      profile.verificationStatus === 'REJECTED'
                    }
                    onClick={() => handleAction('reject', selected)}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>

                  {/* GRANT EDIT */}
                  <button
                    disabled={
                      working ||
                      !profile ||
                      !selected.isActive ||
                      profile.profileEditAllowed === true
                    }
                    onClick={() => handleAction('grant-edit', selected)}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-40"
                  >
                    <Unlock size={17} />
                    Grant edit
                  </button>

                  {/* DEACTIVATE / REACTIVATE */}
                  {selected.isActive ? (
                    <button
                      disabled={working}
                      onClick={() => handleAction('deactivate', selected)}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-40"
                    >
                      <UserX size={17} />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      disabled={working}
                      onClick={() => handleAction('reactivate', selected)}
                      className="flex items-center gap-2 rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 disabled:opacity-40"
                    >
                      <UserCheck size={17} />
                      Reactivate
                    </button>
                  )}

                  {/* DELETE PROFILE */}
                  <button
                    disabled={working || !profile}
                    onClick={() =>
                      handleAction('delete-profile', selected)
                    }
                    className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={17} />
                    Delete Student Profile
                  </button>
                </div>

                {working && (
                  <p className="mt-3 text-sm text-slate-500">
                    Updating student record...
                  </p>
                )}

                {!profile && (
                  <p className="mt-3 text-sm text-slate-500">
                    This student does not currently have an academic profile.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value !== undefined && value !== null && value !== ''
          ? value
          : '—'}
      </p>
    </div>
  );
}
