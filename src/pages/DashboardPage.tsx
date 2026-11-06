import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataService } from '../lib/dataService';
import { Survey, SurveyStatus } from '../types/database';
import {
  Plus,
  Search,
  Filter,
  Play,
  Square,
  BarChart2,
  Edit,
  Copy,
  Archive,
  Trash2,
  QrCode,
  AlertTriangle,
  Calendar,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmSurvey, setDeleteConfirmSurvey] = useState<Survey | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await DataService.listSurveys();
      setSurveys(data);
    } catch (err) {
      console.error('Failed to load surveys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleActivate = async (survey: Survey) => {
    try {
      setActionLoading(survey.id);
      await DataService.activateSurvey(survey.id);
      await loadSurveys();
      navigate(`/surveys/${survey.id}/present`);
    } catch (err: any) {
      alert(err?.message || 'Failed to activate survey');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (survey: Survey) => {
    if (!confirm(`Close "${survey.title}"? Students will no longer be able to submit responses.`)) {
      return;
    }
    try {
      setActionLoading(survey.id);
      await DataService.closeSurvey(survey.id);
      await loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Failed to close survey');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (survey: Survey) => {
    try {
      setActionLoading(survey.id);
      const duplicate = await DataService.duplicateSurvey(survey.id);
      await loadSurveys();
      navigate(`/surveys/${duplicate.id}/edit`);
    } catch (err: any) {
      alert(err?.message || 'Failed to duplicate survey');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (survey: Survey) => {
    try {
      setActionLoading(survey.id);
      await DataService.archiveSurvey(survey.id);
      await loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Failed to archive survey');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmSurvey) return;
    try {
      setActionLoading(deleteConfirmSurvey.id);
      await DataService.deleteSurvey(deleteConfirmSurvey.id);
      setDeleteConfirmSurvey(null);
      await loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete survey');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SurveyStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            Active
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Closed
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Archived
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Actions */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Survey Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Prepare, activate, and review in-class understanding surveys.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={loadSurveys}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm"
            title="Refresh surveys"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/surveys/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Create New Survey
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys by title..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto py-2 pl-3 pr-8 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition"
          >
            <option value="all">All Surveys</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Surveys List / Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Loading surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          {search || statusFilter !== 'all' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">No matching surveys found</h3>
              <p className="text-sm text-slate-500 mb-4">
                Try adjusting your search criteria or clearing your status filter.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="text-sm text-indigo-600 font-semibold hover:text-indigo-800"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">You have not created any surveys yet</h3>
              <p className="text-sm text-slate-500 mb-6">
                Create your first in-class survey to assess student understanding in real-time.
              </p>
              <Link
                to="/surveys/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Your First Survey
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => {
            const isTargetLoading = actionLoading === survey.id;
            return (
              <div
                key={survey.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                  survey.status === 'active'
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow'
                }`}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1" title={survey.title}>
                      {survey.title}
                    </h3>
                    <div>{getStatusBadge(survey.status)}</div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-4">
                    {survey.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {new Date(survey.created_at).toLocaleDateString()}</span>
                  </div>

                  {survey.public_slug && (
                    <div className="mt-2 py-1 px-2.5 bg-slate-50 border border-slate-100 rounded text-xs font-mono text-slate-600 flex items-center justify-between">
                      <span>Slug: <strong>{survey.public_slug}</strong></span>
                      {survey.status === 'active' && (
                        <Link
                          to={`/s/${survey.public_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          Student link <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer / Actions */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Primary Action Button based on status */}
                    {survey.status === 'active' ? (
                      <>
                        <Link
                          to={`/surveys/${survey.id}/present`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Present
                        </Link>
                        <button
                          onClick={() => handleClose(survey)}
                          disabled={isTargetLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
                        >
                          <Square className="w-3 h-3 text-red-500" />
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleActivate(survey)}
                          disabled={isTargetLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Activate
                        </button>
                        {survey.status !== 'archived' && (
                          <Link
                            to={`/surveys/${survey.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
                          >
                            <Edit className="w-3 h-3 text-slate-500" />
                            Edit
                          </Link>
                        )}
                      </>
                    )}

                    {/* Results */}
                    <Link
                      to={`/surveys/${survey.id}/results`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                      Results
                    </Link>
                  </div>

                  {/* Secondary Dropdown / Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(survey)}
                      title="Duplicate survey"
                      disabled={isTargetLoading}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {survey.status !== 'archived' ? (
                      <button
                        onClick={() => handleArchive(survey)}
                        title="Archive survey"
                        disabled={isTargetLoading}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => setDeleteConfirmSurvey(survey)}
                      title="Delete survey"
                      disabled={isTargetLoading}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSurvey && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete &quot;{deleteConfirmSurvey.title}&quot;?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone. This will permanently delete the survey, its questions, answer choices, and all student submissions recorded so far.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSurvey(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition"
              >
                Delete Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
