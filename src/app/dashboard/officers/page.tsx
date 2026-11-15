
'use client';

import { useEffect, useState } from 'react';

type Officer = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function loadOfficers() {
    try {
      const response = await fetch('/api/super-admin/officers');
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Unable to load officers.');
        return;
      }

      setOfficers(data.officers || []);
    } catch {
      setMessage('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOfficers();
  }, []);

  async function createOfficer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/super-admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Officer creation failed.');
        return;
      }

      setMessage('Placement Officer created successfully.');
      setName('');
      setEmail('');
      setPassword('');
      await loadOfficers();
    } catch {
      setMessage('Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-blue-600">
        Workspace / Officer Management
      </p>

      <h1 className="mt-2 text-3xl font-bold">Placement Officers</h1>

      <p className="mt-2 text-slate-500">
        Create and manage placement office accounts.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Create new officer</h2>

          <form onSubmit={createOfficer} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Enter officer name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="officer@college.edu"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Temporary password
              </label>
              <input
                required
                type="password"
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="At least 12 characters"
              />
            </div>

            <p className="text-xs text-slate-500">
              Share the temporary password securely with the officer.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create officer account'}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Registered officers</h2>

          {loading ? (
            <p className="mt-5 text-sm text-slate-500">Loading officers...</p>
          ) : officers.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No Placement Officers created yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {officers.map((officer) => (
                <div
                  key={officer._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="font-semibold">{officer.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {officer.email}
                  </div>
                  <div className="mt-2 text-xs">
                    <span
                      className={
                        officer.isActive
                          ? 'font-semibold text-green-700'
                          : 'font-semibold text-red-600'
                      }
                    >
                      {officer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
