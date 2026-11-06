import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { DataService } from '../lib/dataService';
import { SurveyWithQuestions } from '../types/database';
import {
  ArrowLeft,
  Download,
  Square,
  BarChart2,
  RefreshCw,
  ExternalLink,
  Users,
  Copy,
  Check
} from 'lucide-react';

export const PresentSurveyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null);
  const [responseCount, setResponseCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute public survey URL
  const publicSlug = survey?.public_slug || survey?.id;
  const publicUrl = publicSlug ? `${window.location.origin}/s/${publicSlug}` : '';

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await DataService.getSurveyById(id);
      setSurvey(data);
      if (data) {
        const results = await DataService.getSurveyResults(data.id);
        if (results) setResponseCount(results.response_count);
      }
    } catch (err) {
      console.error('Failed to load presentation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-poll response count every 4 seconds for classroom presentation
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Generate QR Code once publicUrl is ready
  useEffect(() => {
    if (publicUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, publicUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).catch((err) => console.error('QR code generation failed', err));

      QRCode.toDataURL(publicUrl, {
        width: 1000,
        margin: 2
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR DataURL generation failed', err));
    }
  }, [publicUrl]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `survey-qr-${survey?.public_slug || survey?.id}.png`;
    a.click();
  };

  const handleCopyUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSurvey = async () => {
    if (!survey) return;
    if (!confirm('Close this survey? Students will no longer be able to submit responses.')) {
      return;
    }
    try {
      setClosing(true);
      await DataService.closeSurvey(survey.id);
      navigate(`/surveys/${survey.id}/results`);
    } catch (err: any) {
      alert(err?.message || 'Failed to close survey');
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-slate-300">Loading classroom presentation...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Survey Not Found</h2>
          <p className="text-slate-400 mb-6">The requested survey could not be loaded.</p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar for Instructor Navigation */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadQr}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Download QR (PNG)
          </button>
          <Link
            to={`/surveys/${survey.id}/results`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View Results
          </Link>
          <button
            onClick={handleCloseSurvey}
            disabled={closing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600/90 text-white hover:bg-red-600 transition disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Close Survey
          </button>
        </div>
      </div>

      {/* Main Presentation Stage */}
      <main className="max-w-4xl mx-auto w-full py-8 text-center flex flex-col items-center justify-center">
        {/* Survey Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Survey Is Live
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
              {survey.description}
            </p>
          )}
        </div>

        {/* Big QR Code Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-indigo-500/30 flex flex-col items-center">
          <canvas ref={canvasRef} className="rounded-xl max-w-full h-auto" />
          <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Scan with your mobile camera
          </p>
        </div>

        {/* Fallback URL for manual entry */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or type direct URL into browser:
          </span>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-indigo-400 font-mono text-base sm:text-xl font-bold">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-2"
            >
              {publicUrl}
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </a>
            <button
              onClick={handleCopyUrl}
              title="Copy URL"
              className="ml-2 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Response Counter */}
        <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800">
          <Users className="w-6 h-6 text-indigo-400" />
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {responseCount}
          </span>
          <span className="text-slate-400 text-sm font-medium">
            {responseCount === 1 ? 'student response recorded' : 'student responses recorded'}
          </span>
          <button
            onClick={loadData}
            title="Refresh response count"
            className="ml-2 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer controls */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        Classroom Projection Mode • Updates automatically as students submit responses
      </footer>
    </div>
  );
};
