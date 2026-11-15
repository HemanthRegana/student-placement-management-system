
'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type Details = {
  departments: {
    department: string;
    verifiedStudents: number;
    placedStudents: number;
    placementPercentage: number;
  }[];
  graduationYears: {
    graduationYear: number;
    verifiedStudents: number;
    placedStudents: number;
    placementPercentage: number;
  }[];
  monthlyTrends: {
    month: string;
    applications: number;
    selected: number;
  }[];
  companies: {
    company: string;
    selectedApplications: number;
    averagePackage: number;
    highestPackage: number;
  }[];
};

export default function AdvancedAnalytics() {
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetails() {
      try {
        const response = await fetch(
          '/api/officer/analytics/details',
          { cache: 'no-store' }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load reports.');
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Loading detailed reports...</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p>;
  if (!data) return null;

  const card = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">CAMPUSFLOW / INSIGHTS</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">
          Advanced Placement Reports
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Department, batch, monthly and company comparisons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={card}>
          <h3 className="mb-4 font-bold">Department-wise Placement</h3>
          {data.departments.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="verifiedStudents" name="Verified Students" />
                <Bar dataKey="placedStudents" name="Placed Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No department data available.</p>}
        </div>

        <div className={card}>
          <h3 className="mb-4 font-bold">Graduation Year Comparison</h3>
          {data.graduationYears.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.graduationYears}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="graduationYear" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="verifiedStudents" name="Verified Students" />
                <Bar dataKey="placedStudents" name="Placed Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No graduation-year data available.</p>}
        </div>

        <div className={card}>
          <h3 className="mb-4 font-bold">Monthly Placement Trends</h3>
          {data.monthlyTrends.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" name="Applications" />
                <Line type="monotone" dataKey="selected" name="Selected" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p>No monthly data available.</p>}
        </div>

        <div className={card}>
          <h3 className="mb-4 font-bold">Company Package Comparison (LPA)</h3>
          {data.companies.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.companies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averagePackage" name="Average Package" />
                <Bar dataKey="highestPackage" name="Highest Package" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No company package data available.</p>}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Reports use verified student profiles and recorded application statuses.
        Package figures are based on selected applications.
      </p>
    </section>
  );
}
