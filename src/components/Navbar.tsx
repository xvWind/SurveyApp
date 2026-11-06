import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, LogOut, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">Classroom Survey</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  Instructor
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!isDemoMode ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Connected to PostgreSQL via Supabase">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Supabase Connected
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Running in standalone mode with browser localStorage">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Local Mock Store
              </span>
            )}

            <Link
              to="/surveys/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Survey</span>
            </Link>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-900 truncate max-w-[160px]">
                    {user.email}
                  </span>
                  <span className="text-[11px] text-slate-500">Instructor Account</span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
