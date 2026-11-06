import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DataService } from '../lib/dataService';
import { SurveyResults } from '../types/database';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  QrCode,
  Users,
  AlertCircle
} from 'lucide-react';

const BAR_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await DataService.getSurveyResults(id);
      if (!data) {
        setError('Survey not found');
      } else {
        setResults(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [id]);

  const handleExportCsv = async () => {
    if (!id || !results) return;
    try {
      setExporting(true);
      const csv = await DataService.exportSurveyCsv(id);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-${results.title.replace(/\s+/g, '_')}-results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err?.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !results) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">Aggregating survey responses...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Results</h2>
        <p className="text-slate-600 mb-6">{error || 'Survey could not be loaded.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {results.title}
              </h1>
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {results.status}
              </span>
            </div>
            {results.description && (
              <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                {results.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadResults}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm"
              title="Refresh results"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {results.status === 'active' && (
              <Link
                to={`/surveys/${results.survey_id}/present`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>Present QR</span>
              </Link>
            )}

            <button
              onClick={handleExportCsv}
              disabled={exporting || results.response_count === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Count Metric Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Submissions
            </span>
            <div className="text-3xl font-black text-slate-900">
              {results.response_count}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          Last refreshed: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Zero Responses Empty State */}
      {results.response_count === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No responses yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Display the QR code in class so students can scan and submit their answers.
          </p>
          {results.status === 'active' ? (
            <Link
              to={`/surveys/${results.survey_id}/present`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              Present QR Code Now
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-400">
              Survey must be Active to accept responses.
            </span>
          )}
        </div>
      ) : (
        /* Question Results List */
        <div className="space-y-8">
          {results.questions.map((q, qIdx) => {
            const chartData = q.choices.map((c) => ({
              name: c.choice_text,
              count: c.count,
              percentage: c.percentage
            }));

            return (
              <div
                key={q.question_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {q.question_text}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        {q.question_type === 'true_false' ? 'True / False' : 'Multiple Choice'} •{' '}
                        {q.response_count} responses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Detailed Choice Metrics Table */}
                  <div className="space-y-3">
                    {q.choices.map((choice, cIdx) => (
                      <div
                        key={choice.choice_id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: BAR_COLORS[cIdx % BAR_COLORS.length] }}
                            />
                            {choice.choice_text}
                          </span>
                          <span className="font-mono text-xs text-slate-600">
                            {choice.count} ({choice.percentage}%)
                          </span>
                        </div>

                        {/* Progress visual bar */}
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${choice.percentage}%`,
                              backgroundColor: BAR_COLORS[cIdx % BAR_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Recharts Horizontal/Vertical Bar Chart */}
                  <div className="h-64 w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 'dataMax + 2']} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 11, fill: '#475569' }}
                        />
                        <Tooltip
                          formatter={(value: any, _name: any, item: any) => [
                            `${value} votes (${item.payload.percentage}%)`,
                            'Responses'
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '0.75rem',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
