import React, { useState } from 'react';
import {
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  setCustomSupabaseCredentials
} from '../lib/supabase';
import { Database, CheckCircle2, AlertCircle, X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [key, setKey] = useState(supabaseAnonKey || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(url, key);
  };

  const handleReset = () => {
    setCustomSupabaseCredentials('', '');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Database Connection Settings</h3>
              <p className="text-xs text-slate-500">Inspect or configure your PostgreSQL / Supabase backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="mb-5 p-3 rounded-xl border flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-900 font-semibold">Active Backend: Live Supabase PostgreSQL</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-slate-900 font-semibold">Active Backend: Local Standalone Mock Store</span>
              </>
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isSupabaseConfigured ? 'Connected' : 'Offline Mock'}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL (e.g. https://xyz.supabase.co)
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon / Public Key
            </label>
            <textarea
              rows={3}
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 hover:text-red-600 transition"
            >
              Reset to Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
