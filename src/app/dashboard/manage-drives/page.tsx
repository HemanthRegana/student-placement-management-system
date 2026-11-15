
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  IndianRupee,
  Pencil,
  X,
  Power,
  RefreshCw,
} from 'lucide-react';

type Job = {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  location?: string;
  packageLpa: number;
  minCgpa: number;
  maxBacklogs: number;
  eligibleDepartments: string[];
  graduationYear?: number;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
};

type DriveForm = {
  title: string;
  companyName: string;
  description: string;
  location: string;
  packageLpa: string;
  minCgpa: string;
  maxBacklogs: string;
  eligibleDepartments: string;
  graduationYear: string;
  deadline: string;
};

const emptyForm: DriveForm = {
  title: '',
  companyName: '',
  description: '',
  location: '',
  packageLpa: '',
  minCgpa: '0',
  maxBacklogs: '0',
  eligibleDepartments: '',
  graduationYear: '',
  deadline: '',
};

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ManageDrivesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DriveForm>(emptyForm);

  const loadJobs = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/officer/jobs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load drives.');
      }

      setJobs(data.jobs || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to load drives.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function updateField<K extends keyof DriveForm>(
    key: K,
    value: DriveForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setShowForm(true);
  }

  function startEdit(job: Job) {
    setEditingId(job._id);
    setForm({
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      location: job.location || '',
      packageLpa: String(job.packageLpa),
      minCgpa: String(job.minCgpa),
      maxBacklogs: String(job.maxBacklogs),
      eligibleDepartments: (job.eligibleDepartments || []).join(', '),
      graduationYear: job.graduationYear
        ? String(job.graduationYear)
        : '',
      deadline: toLocalDateTime(job.deadline),
    });

    setMessage('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveDrive(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        title: form.title.trim(),
        companyName: form.companyName.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        packageLpa: Number(form.packageLpa),
        minCgpa: Number(form.minCgpa),
        maxBacklogs: Number(form.maxBacklogs),
        eligibleDepartments: form.eligibleDepartments
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : null,
        deadline: new Date(form.deadline).toISOString(),
      };

      const response = await fetch(
        editingId
          ? `/api/officer/jobs/${editingId}`
          : '/api/officer/jobs',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save drive.');
      }

      setMessage(
        editingId
          ? 'Placement drive updated successfully.'
          : 'Placement drive created successfully.'
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadJobs();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to save drive.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(job: Job) {
    const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';

    if (
      !window.confirm(
        `${nextStatus === 'CLOSED' ? 'Close' : 'Reopen'} the drive for ${job.companyName}?`
      )
    ) {
      return;
    }

    setMessage('');

    try {
      const response = await fetch(`/api/officer/jobs/${job._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update drive status.');
      }

      setMessage(`Drive ${nextStatus.toLowerCase()} successfully.`);
      await loadJobs();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to update status.'
      );
    }
  }

  const openCount = jobs.filter((job) => job.status === 'OPEN').length;
  const closedCount = jobs.length - openCount;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Workspace / Drive Management
          </p>
          <h1 className="mt-2 text-3xl font-bold">Manage placement drives</h1>
          <p className="mt-2 text-slate-500">
            Create opportunities and manage eligibility criteria.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create drive
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total drives</p>
          <p className="mt-2 text-3xl font-bold">{jobs.length}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Open drives</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {openCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Closed drives</p>
          <p className="mt-2 text-3xl font-bold text-slate-600">
            {closedCount}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={saveDrive}
          className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit placement drive' : 'Create placement drive'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the company and eligibility details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title">
              <input
                required
                minLength={3}
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Software Engineer"
                className="field"
              />
            </Field>

            <Field label="Company name">
              <input
                required
                minLength={2}
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Company name"
                className="field"
              />
            </Field>

            <Field label="Package (LPA)">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.packageLpa}
                onChange={(e) => updateField('packageLpa', e.target.value)}
                className="field"
              />
            </Field>

            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Bengaluru / Hyderabad / Remote"
                className="field"
              />
            </Field>

            <Field label="Minimum CGPA">
              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={form.minCgpa}
                onChange={(e) => updateField('minCgpa', e.target.value)}
                className="field"
              />
            </Field>

            <Field label="Maximum active backlogs">
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.maxBacklogs}
                onChange={(e) => updateField('maxBacklogs', e.target.value)}
                className="field"
              />
            </Field>

            <Field label="Eligible departments">
              <input
                value={form.eligibleDepartments}
                onChange={(e) =>
                  updateField('eligibleDepartments', e.target.value)
                }
                placeholder="CSE, IT, ECE (blank = all)"
                className="field"
              />
            </Field>

            <Field label="Graduation year">
              <input
                type="number"
                min="2020"
                max="2100"
                value={form.graduationYear}
                onChange={(e) =>
                  updateField('graduationYear', e.target.value)
                }
                placeholder="Blank = all years"
                className="field"
              />
            </Field>

            <Field label="Application deadline">
              <input
                required
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
                className="field"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Job description">
                <textarea
                  required
                  minLength={10}
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe the role, responsibilities and requirements..."
                  className="field"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Publish drive'}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-6 py-3 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">All placement drives</h2>

        <button
          onClick={loadJobs}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading drives…</p>
      ) : jobs.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed p-10 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-400" size={32} />
          <p className="mt-3 font-semibold">No placement drives created</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first placement drive to get started.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <article
              key={job._id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <BriefcaseBusiness />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    job.status === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold">{job.title}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {job.companyName}
              </p>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {job.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <IndianRupee size={14} />
                  {job.packageLpa} LPA
                </span>

                <span className="flex items-center gap-2">
                  <MapPin size={14} />
                  {job.location || 'Not specified'}
                </span>

                <span>Minimum CGPA: {job.minCgpa}</span>
                <span>Max active backlogs: {job.maxBacklogs}</span>

                <span className="col-span-2">
                  Departments:{' '}
                  {job.eligibleDepartments?.length
                    ? job.eligibleDepartments.join(', ')
                    : 'All departments'}
                </span>

                <span className="col-span-2">
                  Graduation year: {job.graduationYear || 'All years'}
                </span>

                <span className="col-span-2 flex items-center gap-2">
                  <CalendarDays size={14} />
                  Deadline: {new Date(job.deadline).toLocaleString()}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => startEdit(job)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  onClick={() => changeStatus(job)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${
                    job.status === 'OPEN'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Power size={15} />
                  {job.status === 'OPEN' ? 'Close drive' : 'Reopen drive'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .field {
          width: 100%;
          margin-top: 6px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 11px 12px;
          font-size: 14px;
          outline: none;
        }

        .field:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgb(37 99 235 / 12%);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
