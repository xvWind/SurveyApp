import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, Smartphone, BarChart3, QrCode } from 'lucide-react';
import { DataService } from '../lib/dataService';
import { Survey } from '../types/database';

export const LandingPage: React.FC = () => {
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    DataService.listSurveys().then((surveys) => {
      const active = surveys.find((s) => s.status === 'active');
      if (active) setActiveSurvey(active);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 flex flex-col justify-between">
      {/* Header */}
      <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <CheckSquare className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Classroom Survey</span>
        </div>
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition"
          >
            Instructor Login
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 mb-6">
          <QrCode className="w-3.5 h-3.5" />
          Instant In-Class Assessment via QR Code
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
          Quick In-Class Concept & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Understanding Checks
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Project a QR code on screen. Students scan and answer from their phones without creating an account.
          Instructors receive instant feedback and aggregate analytics.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition transform hover:-translate-y-0.5"
          >
            Open Instructor Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>

          {activeSurvey && (
            <Link
              to={`/s/${activeSurvey.public_slug || activeSurvey.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              <Smartphone className="w-4 h-4" />
              Join Active Survey Demo
            </Link>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1.5">No Student Accounts</h3>
            <p className="text-sm text-slate-600 leading-normal">
              Students simply point their phone camera at the classroom projector and submit answers anonymously.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1.5">One-Click Activation</h3>
            <p className="text-sm text-slate-600 leading-normal">
              Prepare Multiple Choice and True/False questions in advance. Activate with a single click during lecture.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1.5">Instant Visual Results</h3>
            <p className="text-sm text-slate-600 leading-normal">
              View response distributions and percentages. Export raw historical responses to CSV anytime.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Classroom Survey Web Application • Built with React, Supabase & Tailwind CSS
      </footer>
    </div>
  );
};
