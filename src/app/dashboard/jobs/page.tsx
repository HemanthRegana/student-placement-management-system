
'use client';

import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  IndianRupee,
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
  deadline: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [msg, setMsg] = useState('Loading opportunities…');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load placement drives.');
        }

        setJobs(data.jobs || []);
        setAppliedJobIds(data.appliedJobIds || []);

        setMsg(
          data.jobs?.length
            ? ''
            : 'No open placement drives at the moment.'
        );
      } catch (error) {
        setMsg(
          error instanceof Error
            ? error.message
            : 'Could not load placement drives.'
        );
      }
    }

    loadJobs();
  }, []);

  async function apply(jobId: string) {
    // Prevent applying again to an already applied drive
    if (appliedJobIds.includes(jobId) || busy) {
      return;
    }

    setBusy(jobId);
    setMsg('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // The application already exists in the database
        setAppliedJobIds((previous) =>
          previous.includes(jobId) ? previous : [...previous, jobId]
        );
        setMsg('You have already applied to this placement drive.');
        return;
      }

      if (!response.ok) {
        setMsg(data.error || 'Unable to submit application.');
        return;
      }

      // Update button immediately after successful application
      setAppliedJobIds((previous) =>
        previous.includes(jobId) ? previous : [...previous, jobId]
      );

      setMsg('Application submitted successfully!');
    } catch {
      setMsg('Something went wrong. Please try again.');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-blue-600">
        Workspace / Opportunities
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        Placement drives
      </h1>

      <p className="mt-2 text-slate-500">
        Explore opportunities and check the eligibility criteria.
      </p>

      {msg && (
        <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </p>
      )}

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => {
          const alreadyApplied = appliedJobIds.includes(job._id);
          const isApplying = busy === job._id;

          return (
            <article
              key={job._id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <BriefcaseBusiness />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  OPEN
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold">
                {job.title}
              </h2>

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

                <span>
                  Minimum CGPA: {job.minCgpa}
                </span>

                <span>
                  Max active backlogs: {job.maxBacklogs}
                </span>

                <span className="col-span-2 flex items-center gap-2">
                  <CalendarDays size={14} />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={() => apply(job._id)}
                disabled={!!busy || alreadyApplied}
                className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition ${
                  alreadyApplied
                    ? 'cursor-not-allowed bg-emerald-100 text-emerald-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                {alreadyApplied
                  ? '✓ Applied'
                  : isApplying
                    ? 'Applying…'
                    : 'Apply now'}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
