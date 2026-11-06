import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SurveyEditorPage } from './pages/SurveyEditorPage';
import { PresentSurveyPage } from './pages/PresentSurveyPage';
import { ResultsPage } from './pages/ResultsPage';
import { StudentSurveyPage } from './pages/StudentSurveyPage';

// Layout with Instructor Navbar
const InstructorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Classroom Survey Web App • Instructor Console
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Public Student Survey Views */}
          <Route path="/s/:slug" element={<StudentSurveyPage />} />

          {/* Protected Instructor Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <InstructorLayout>
                  <DashboardPage />
                </InstructorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/new"
            element={
              <ProtectedRoute>
                <InstructorLayout>
                  <SurveyEditorPage />
                </InstructorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/:id/edit"
            element={
              <ProtectedRoute>
                <InstructorLayout>
                  <SurveyEditorPage />
                </InstructorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/:id/results"
            element={
              <ProtectedRoute>
                <InstructorLayout>
                  <ResultsPage />
                </InstructorLayout>
              </ProtectedRoute>
            }
          />

          {/* Present Survey has its own full-screen projector layout */}
          <Route
            path="/surveys/:id/present"
            element={
              <ProtectedRoute>
                <PresentSurveyPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
