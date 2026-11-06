import React, { useEffect, useState, useCallback } from 'react';
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
  Check,
  Wifi,
  AlertTriangle,
  Settings2
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
  const [qrError, setQrError] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Custom base origin configuration (useful when testing with mobile phones over LAN)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [customOrigin, setCustomOrigin] = useState<string>(window.location.origin);

  // Compute public survey URL
  const publicSlug = survey?.public_slug || survey?.id;
  const baseOrigin = customOrigin.replace(/\/+$/, '');
  const publicUrl = publicSlug ? `${baseOrigin}/s/${publicSlug}` : '';

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

  // Robust QR Code Generation
  const generateQrCode = useCallback(async (url: string) => {
    if (!url) return;
    try {
      setIsGeneratingQr(true);
      setQrError(null);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      console.error('QR code generation failed:', err);
      setQrError('Failed to generate QR code.');
    } finally {
      setIsGeneratingQr(false);
    }
  }, []);

  useEffect(() => {
    if (publicUrl) {
      generateQrCode(publicUrl);
    }
  }, [publicUrl, generateQrCode]);

  const handleDownloadQr = async () => {
    try {
      let downloadUrl = qrDataUrl;
      if (!downloadUrl && publicUrl) {
        downloadUrl = await QRCode.toDataURL(publicUrl, { width: 1000, margin: 2 });
      }
      if (!downloadUrl) return;

      const filename = `survey-qr-${survey?.public_slug || survey?.id || 'code'}.png`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download QR code', err);
      alert('Failed to download QR code image.');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-slate-300">Loading classroom presentation...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
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
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800 flex-wrap gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowNetworkSettings(!showNetworkSettings)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition border border-slate-700"
            title="Configure QR Host URL"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Host URL</span>
          </button>

          <button
            onClick={handleDownloadQr}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm"
            title="Download QR code PNG for slides"
          >
            <Download className="w-3.5 h-3.5" />
            Download QR (PNG)
          </button>

          <Link
            to={`/surveys/${survey.id}/results`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition border border-slate-700"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
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

      {/* Localhost / Network Helper Banner */}
      {isLocalhost && showNetworkSettings && (
        <div className="max-w-2xl mx-auto w-full mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Wifi className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-slate-200">
                Mobile Testing Notice (Local Network vs. Localhost)
              </p>
              <p className="text-slate-400 leading-relaxed">
                Phones scanning a <code>localhost</code> QR code will connect to their own device loopback and fail.
                To test scanning from your phone on the same Wi-Fi, change the base URL below to your computer&apos;s LAN IP (or production domain).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  placeholder="e.g. http://192.168.1.50:5173"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setCustomOrigin(window.location.origin)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Presentation Stage */}
      <main className="max-w-4xl mx-auto w-full py-6 text-center flex flex-col items-center justify-center">
        {/* Survey Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Survey Is Live
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="mt-2.5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              {survey.description}
            </p>
          )}
        </div>

        {/* QR Code Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-indigo-500/30 flex flex-col items-center min-w-[320px] sm:min-w-[400px]">
          {isGeneratingQr ? (
            <div className="w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Generating QR Code...</p>
            </div>
          ) : qrError ? (
            <div className="w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-xs font-semibold">{qrError}</p>
              <button
                onClick={() => generateQrCode(publicUrl)}
                className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${survey.title}`}
              className="w-72 h-72 sm:w-80 sm:h-80 rounded-xl object-contain shadow-inner"
            />
          ) : (
            <div className="w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center text-slate-400 text-xs">
              No QR Code available
            </div>
          )}
          <p className="mt-4 text-xs font-bold text-slate-600 tracking-wider uppercase">
            Scan with your mobile camera
          </p>
        </div>

        {/* Fallback URL for manual entry */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or enter URL directly:
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
        <div className="mt-8 inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-800">
          <Users className="w-5 h-5 text-indigo-400" />
          <span className="text-2xl font-extrabold text-white">
            {responseCount}
          </span>
          <span className="text-slate-400 text-xs font-medium">
            {responseCount === 1 ? 'student response' : 'student responses'}
          </span>
          <button
            onClick={loadData}
            title="Refresh response count"
            className="ml-2 p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* Footer controls */}
      <footer className="max-w-6xl mx-auto w-full pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Classroom Projection Mode • Auto-refreshes every 4 seconds
      </footer>
    </div>
  );
};
