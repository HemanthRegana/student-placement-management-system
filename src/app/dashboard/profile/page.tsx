'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Save,
  UserRound,
  GraduationCap,
  FileText,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type AcademicProfile = {
  fullName: string;
  rollNumber: string;
  phone: string;
  department: string;
  graduationYear: string;
  cgpa: string;
  activeBacklogs: string;
  historicalBacklogs: string;
  tenthMarksheetUrl: string;
  twelfthMarksheetUrl: string;
  resumeUrl: string;
  tenth: {
    board: string;
    year: string;
    percentage: string;
  };
  twelfth: {
    board: string;
    year: string;
    percentage: string;
  };
};

const emptyProfile: AcademicProfile = {
  fullName: '',
  rollNumber: '',
  phone: '',
  department: '',
  graduationYear: '',
  cgpa: '',
  activeBacklogs: '0',
  historicalBacklogs: '0',
  tenthMarksheetUrl: '',
  twelfthMarksheetUrl: '',
  resumeUrl: '',
  tenth: {
    board: '',
    year: '',
    percentage: '',
  },
  twelfth: {
    board: '',
    year: '',
    percentage: '',
  },
};

const departments = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'Chemical',
  'Other',
];

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<AcademicProfile>(emptyProfile);

  const [verificationStatus, setVerificationStatus] = useState(
    'PENDING_VERIFICATION'
  );

  const [profileLocked, setProfileLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/student/profile');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load profile.');
        }

        if (data.profile) {
          const p = data.profile;

          setProfile({
            fullName: p.fullName || '',
            rollNumber: p.rollNumber || '',
            phone: p.phone || '',
            department: p.department || '',
            graduationYear: p.graduationYear?.toString() || '',
            cgpa: p.cgpa?.toString() || '',
            activeBacklogs: (p.activeBacklogs ?? 0).toString(),
            historicalBacklogs: (
              p.historicalBacklogs ?? 0
            ).toString(),
            tenthMarksheetUrl: p.tenthMarksheetUrl || '',
            twelfthMarksheetUrl: p.twelfthMarksheetUrl || '',
            resumeUrl: p.resumeUrl || '',

            tenth: {
              board: p.tenth?.board || '',
              year: p.tenth?.year?.toString() || '',
              percentage: p.tenth?.percentage?.toString() || '',
            },

            twelfth: {
              board: p.twelfth?.board || '',
              year: p.twelfth?.year?.toString() || '',
              percentage: p.twelfth?.percentage?.toString() || '',
            },
          });

          setVerificationStatus(
            p.verificationStatus || 'PENDING_VERIFICATION'
          );

          setProfileLocked(
            p.profileLocked === true ||
            p.profileEditAllowed === false
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(field: keyof AcademicProfile, value: string) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateSchool(
    school: 'tenth' | 'twelfth',
    field: 'board' | 'year' | 'percentage',
    value: string
  ) {
    setProfile((previous) => ({
      ...previous,
      [school]: {
        ...previous[school],
        [field]: value,
      },
    }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (profileLocked) {
      setError('Your profile is locked. Contact the placement officer.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      ...profile,

      graduationYear: profile.graduationYear
        ? Number(profile.graduationYear)
        : undefined,

      cgpa:
        profile.cgpa === ''
          ? undefined
          : Number(profile.cgpa),

      activeBacklogs: Number(profile.activeBacklogs),
      historicalBacklogs: Number(profile.historicalBacklogs),

      tenth: {
        board: profile.tenth.board,
        year: profile.tenth.year
          ? Number(profile.tenth.year)
          : undefined,
        percentage:
          profile.tenth.percentage === ''
            ? undefined
            : Number(profile.tenth.percentage),
      },

      twelfth: {
        board: profile.twelfth.board,
        year: profile.twelfth.year
          ? Number(profile.twelfth.year)
          : undefined,
        percentage:
          profile.twelfth.percentage === ''
            ? undefined
            : Number(profile.twelfth.percentage),
      },
    };

    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to save profile.'
        );
      }

      setProfileLocked(true);

      setVerificationStatus(
        data.profile?.verificationStatus ||
        'PENDING_VERIFICATION'
      );

      setMessage(
        'Your academic profile has been submitted successfully and is now locked.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

  const labelClass = 'text-sm font-semibold text-slate-700';

  function renderInput(
    label: string,
    value: string,
    onChange: (value: string) => void,
    type = 'text',
    placeholder = ''
  ) {
    return (
      <label className={labelClass}>
        {label}

        <input
          className={inputClass}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={profileLocked}
          min={type === 'number' ? 0 : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
        Loading your academic profile...
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700',
    VERIFIED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    INACTIVE: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page heading */}

      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">
          Workspace / My Profile
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Academic Profile
        </h1>

        <p className="mt-2 text-slate-500">
          Maintain your academic information for placement eligibility.
        </p>
      </div>

      {/* Profile lock status */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              {profileLocked ? (
                <Lock size={23} />
              ) : (
                <ShieldCheck size={23} />
              )}
            </span>

            <div>
              <h2 className="font-semibold text-slate-800">
                Academic profile status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {profileLocked
                  ? 'Your submitted details are locked.'
                  : 'Complete your profile and submit it for verification.'}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              profileLocked
                ? 'bg-slate-100 text-slate-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {profileLocked ? 'LOCKED' : 'EDITABLE'}
          </span>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">
              Admin verification
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                statusColors[verificationStatus] ||
                'bg-slate-100 text-slate-600'
              }`}
            >
              {verificationStatus.replaceAll('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Success message */}

      {message && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={20} className="shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {/* Error message */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Locked information */}

      {profileLocked && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Lock
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <h3 className="font-bold text-amber-900">
                Your profile is locked
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                You cannot change your academic information after
                submission. If you find any mistakes, contact your
                placement officer. The officer can grant temporary
                editing permission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Academic profile form */}

      <form onSubmit={saveProfile} className="space-y-6">
        <fieldset
          disabled={profileLocked}
          className="space-y-6 disabled:opacity-90"
        >
          {/* Personal details */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <UserRound className="text-blue-600" />

              <div>
                <h2 className="font-bold text-slate-900">
                  Personal details
                </h2>

                <p className="text-sm text-slate-500">
                  Your basic student information
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {renderInput(
                'Full name',
                profile.fullName,
                (v) => updateField('fullName', v)
              )}

              {renderInput(
                'Roll number',
                profile.rollNumber,
                (v) => updateField('rollNumber', v)
              )}

              {renderInput(
                'Phone number',
                profile.phone,
                (v) => updateField('phone', v),
                'tel'
              )}

              <label className={labelClass}>
                Department

                <select
                  className={inputClass}
                  value={profile.department}
                  onChange={(e) =>
                    updateField('department', e.target.value)
                  }
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              {renderInput(
                'Graduation year',
                profile.graduationYear,
                (v) => updateField('graduationYear', v),
                'number',
                'e.g. 2027'
              )}
            </div>
          </section>

          {/* College academics */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <GraduationCap className="text-blue-600" />

              <div>
                <h2 className="font-bold text-slate-900">
                  College academics
                </h2>

                <p className="text-sm text-slate-500">
                  Enter your latest academic performance
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {renderInput(
                'CGPA / CPI (out of 10)',
                profile.cgpa,
                (v) => updateField('cgpa', v),
                'number',
                'e.g. 8.25'
              )}

              {renderInput(
                'Active backlogs',
                profile.activeBacklogs,
                (v) => updateField('activeBacklogs', v),
                'number',
                '0'
              )}

              {renderInput(
                'Historical backlogs',
                profile.historicalBacklogs,
                (v) => updateField('historicalBacklogs', v),
                'number',
                '0'
              )}
            </div>
          </section>

          {/* 10th and 12th details */}

          {(['tenth', 'twelfth'] as const).map((school) => (
            <section
              key={school}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-3">
                <FileText className="text-blue-600" />

                <div>
                  <h2 className="font-bold text-slate-900">
                    {school === 'tenth'
                      ? '10th Standard'
                      : '12th Standard / Diploma'}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your school academic details
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {renderInput(
                  'Board',
                  profile[school].board,
                  (v) => updateSchool(school, 'board', v),
                  'text',
                  'e.g. CBSE / State Board'
                )}

                {renderInput(
                  'Passing year',
                  profile[school].year,
                  (v) => updateSchool(school, 'year', v),
                  'number',
                  'e.g. 2021'
                )}

                {renderInput(
                  'Percentage',
                  profile[school].percentage,
                  (v) => updateSchool(school, 'percentage', v),
                  'number',
                  'e.g. 85.5'
                )}
              </div>
            </section>
          ))}

          {/* Document links */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="text-blue-600" />
              <div>
                <h2 className="font-bold text-slate-900">
                  Document Links
                </h2>
                <p className="text-sm text-slate-500">
                  Paste sharing links for your academic documents.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              {renderInput(
                '10th Marksheet Link',
                profile.tenthMarksheetUrl,
                (value) => updateField('tenthMarksheetUrl', value),
                'url',
                'https://drive.google.com/...'
              )}

              {renderInput(
                '12th Marksheet Link',
                profile.twelfthMarksheetUrl,
                (value) => updateField('twelfthMarksheetUrl', value),
                'url',
                'https://drive.google.com/...'
              )}

              {renderInput(
                'Resume Link',
                profile.resumeUrl,
                (value) => updateField('resumeUrl', value),
                'url',
                'https://drive.google.com/...'
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Set your document-sharing permissions so placement officers
              can view the documents. Only paste links you are authorized to share.
            </p>
          </section>
        </fieldset>

        {/* Submit or locked information */}

        {profileLocked ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-slate-500" />

              <div>
                <p className="font-semibold text-slate-800">
                  Editing disabled
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Only the placement officer can grant permission
                  to edit this profile.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              {saving
                ? 'Submitting...'
                : 'Submit & Lock Profile'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
