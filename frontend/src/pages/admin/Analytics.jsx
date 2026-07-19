import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { HiOutlineDownload } from 'react-icons/hi';
import {
  fetchOverview,
  fetchDownloadsAnalytics,
  fetchEventAnalytics,
  fetchPlacementAnalytics,
  fetchUserAnalytics,
} from '../../services/analyticsService';
import { TextInput } from '../../components/FormField';
import { exportToCSV } from '../../utils/csvExport';

const CHART_COLOR = '#4f46e5';
const CHART_COLOR_2 = '#10b981';

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function Analytics() {
  const [downloadFilters, setDownloadFilters] = useState({ department: '', semester: '', subject: '' });
  const [dateRange, setDateRange] = useState({ startDate: todayISO(-30), endDate: todayISO() });

  const overviewQuery = useQuery({ queryKey: ['analytics-overview'], queryFn: fetchOverview });
  const downloadsQuery = useQuery({
    queryKey: ['analytics-downloads', downloadFilters],
    queryFn: () => fetchDownloadsAnalytics(downloadFilters),
  });
  const eventsQuery = useQuery({
    queryKey: ['analytics-events', dateRange],
    queryFn: () => fetchEventAnalytics(dateRange),
  });
  const placementsQuery = useQuery({
    queryKey: ['analytics-placements', dateRange],
    queryFn: () => fetchPlacementAnalytics(dateRange),
  });
  const usersQuery = useQuery({
    queryKey: ['analytics-users', dateRange],
    queryFn: () => fetchUserAnalytics(dateRange),
  });

  const metrics = overviewQuery.data;

  const metricCards = metrics
    ? [
        ['Total Users', metrics.totalUsers],
        ['Active Users', metrics.activeUsers],
        ['Total Notes', metrics.totalNotes],
        ['Total Notes Downloads', metrics.totalNotesDownloads],
        ['Total PYQs', metrics.totalPyqs],
        ['Total PYQ Downloads', metrics.totalPyqDownloads],
        ['Total Placements', metrics.totalPlacements],
        ['Total Applications', metrics.totalApplications],
        ['Total Events', metrics.totalEvents],
        ['Total Registrations', metrics.totalRegistrations],
        ['Total Complaints', metrics.totalComplaints],
        ['Total Support Tickets', metrics.totalSupportTickets],
      ]
    : [];

  const handleExportOverview = () => {
    if (!metrics) return;
    exportToCSV('campusconnect-overview', [metrics]);
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500">Live metrics computed from your CampusConnect data.</p>
          </div>
          <button
            onClick={handleExportOverview}
            disabled={!metrics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <HiOutlineDownload className="h-4 w-4" /> Export Overview CSV
          </button>
        </div>

        {/* Metric cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {overviewQuery.isLoading &&
            [...Array(12)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
          {overviewQuery.isError && (
            <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Failed to load metrics: {overviewQuery.error?.response?.data?.message || overviewQuery.error?.message}
            </div>
          )}
          {metricCards.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Date range filter (applies to Events, Placements, and Users charts) */}
        <div className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="text-xs font-medium text-slate-500">From</label>
            <TextInput type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">To</label>
            <TextInput type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <p className="text-xs text-slate-400">Applies to Event Registrations, Placement Applications, and Daily Active Users below.</p>
        </div>

        {/* Notes downloads by subject */}
        <ChartSection
          title="Notes Downloads by Subject"
          isLoading={downloadsQuery.isLoading}
          isError={downloadsQuery.isError}
          error={downloadsQuery.error}
          data={downloadsQuery.data?.notesBySubject}
          onExport={() => exportToCSV('notes-downloads-by-subject', downloadsQuery.data?.notesBySubject)}
          filters={
            <div className="flex flex-wrap gap-2">
              <TextInput
                placeholder="Department"
                value={downloadFilters.department}
                onChange={(e) => setDownloadFilters({ ...downloadFilters, department: e.target.value })}
                className="w-40"
              />
              <TextInput
                placeholder="Semester"
                type="number"
                min={1}
                max={10}
                value={downloadFilters.semester}
                onChange={(e) => setDownloadFilters({ ...downloadFilters, semester: e.target.value })}
                className="w-28"
              />
              <TextInput
                placeholder="Subject"
                value={downloadFilters.subject}
                onChange={(e) => setDownloadFilters({ ...downloadFilters, subject: e.target.value })}
                className="w-40"
              />
            </div>
          }
        >
          {(data) => (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="downloads" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        {/* PYQ downloads by semester */}
        <ChartSection
          title="PYQ Downloads by Semester"
          isLoading={downloadsQuery.isLoading}
          isError={downloadsQuery.isError}
          error={downloadsQuery.error}
          data={downloadsQuery.data?.pyqsBySemester}
          onExport={() => exportToCSV('pyq-downloads-by-semester', downloadsQuery.data?.pyqsBySemester)}
        >
          {(data) => (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} label={{ value: 'Semester', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="downloads" fill={CHART_COLOR_2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        {/* Placement applications by company */}
        <ChartSection
          title="Placement Applications by Company"
          isLoading={placementsQuery.isLoading}
          isError={placementsQuery.isError}
          error={placementsQuery.error}
          data={placementsQuery.data?.applicationsByCompany}
          onExport={() => exportToCSV('applications-by-company', placementsQuery.data?.applicationsByCompany)}
        >
          {(data) => (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="companyName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        {/* Event registrations over time */}
        <ChartSection
          title="Event Registrations Over Time"
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          error={eventsQuery.error}
          data={eventsQuery.data?.registrationsOverTime}
          onExport={() => exportToCSV('event-registrations-over-time', eventsQuery.data?.registrationsOverTime)}
        >
          {(data) => (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        {/* Daily active users */}
        <ChartSection
          title="Daily Active Users"
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          error={usersQuery.error}
          data={usersQuery.data?.dailyActiveUsers}
          onExport={() => exportToCSV('daily-active-users', usersQuery.data?.dailyActiveUsers)}
          note="Based on each user's most recent login timestamp."
        >
          {(data) => (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={CHART_COLOR_2} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartSection>
      </div>
    </div>
  );
}

function ChartSection({ title, isLoading, isError, error, data, onExport, filters, note, children }) {
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {note && <p className="text-xs text-slate-400">{note}</p>}
        </div>
        <div className="flex items-center gap-3">
          {filters}
          <button
            onClick={onExport}
            disabled={!data || data.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <HiOutlineDownload className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            Failed to load: {error?.response?.data?.message || error?.message}
          </div>
        )}
        {isEmpty && <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">No data yet.</div>}
        {!isLoading && !isError && !isEmpty && children(data)}
      </div>
    </div>
  );
}
