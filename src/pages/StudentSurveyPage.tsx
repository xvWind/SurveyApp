import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataService, getOrCreateStudentToken } from '../lib/dataService';
import { SurveyWithQuestions } from '../types/database';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileQuestion
} from 'lucide-react';

export const StudentSurveyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [closed, setClosed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const studentToken = getOrCreateStudentToken();

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchSurvey = async () => {
      try {
        setLoading(true);
        // Try getting by slug or direct id
        let data = await DataService.getPublicSurvey(slug);
        if (!data) {
          // If not active via public survey query, try getting by ID to inspect status
          const anySurvey = await DataService.getSurveyById(slug);
          if (anySurvey) {
            if (anySurvey.status !== 'active') {
              setClosed(true);
              setLoading(false);
              return;
            }
            data = anySurvey;
          } else {
            setNotFound(true);
            setLoading(false);
            return;
          }
        }

        if (data.status !== 'active') {
          setClosed(true);
          setLoading(false);
          return;
        }

        // Check if token already submitted
        const hasSubmitted = await DataService.hasStudentSubmitted(data.id, studentToken);
        if (hasSubmitted) {
          setAlreadySubmitted(true);
          setSurvey(data);
          setLoading(false);
          return;
        }

        setSurvey(data);
      } catch (err) {
        console.error('Error loading survey', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [slug, studentToken]);

  const handleSelectChoice = (questionId: string, choiceId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId
    }));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validate that every question has been answered
    for (const q of survey.questions) {
      if (!selectedAnswers[q.id]) {
        setValidationError(`Please answer question: "${q.question_text}"`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const answersPayload = survey.questions.map((q) => ({
        question_id: q.id,
        choice_id: selectedAnswers[q.id]
      }));

      const res = await DataService.submitResponse(survey.id, studentToken, answersPayload);

      if (!res.success) {
        if (res.error === 'DUPLICATE_RESPONSE') {
          setAlreadySubmitted(true);
        } else if (res.error === 'SURVEY_NOT_ACTIVE') {
          setClosed(true);
        } else {
          setValidationError(res.error || 'Failed to record response. Please try again.');
        }
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Network error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  // State: Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading classroom survey...</p>
      </div>
    );
  }

  // State: Survey Not Found
  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Survey Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            We couldn&apos;t find an active survey at this link. Please check that you scanned the correct QR code.
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // State: Survey Closed
  if (closed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Survey Is Closed</h2>
          <p className="text-sm text-slate-600 mb-6">
            This survey is no longer accepting responses. The instructor has closed submissions.
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // State: Already Submitted
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Response Already Recorded</h2>
          <p className="text-sm text-slate-600 mb-4">
            You have already submitted a response to &quot;{survey?.title || 'this survey'}&quot;. Each student may submit once per survey.
          </p>
          <div className="py-2 px-3 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-500 mb-6 truncate">
            Device Token: {studentToken}
          </div>
        </div>
      </div>
    );
  }

  // State: Successfully Submitted Just Now
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-200 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Thank you!
          </h1>
          <p className="text-base text-slate-600 mb-6">
            Your response has been securely recorded for &quot;{survey?.title}&quot;.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
            You may now close this browser tab or view the lecture presentation.
          </div>
        </div>
      </div>
    );
  }

  // State: Active Form
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Survey Header */}
        <header className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 mb-2">
            In-Class Survey
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
            {survey?.title}
          </h1>
          {survey?.description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {survey.description}
            </p>
          )}
        </header>

        {validationError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Survey Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {survey?.questions.map((question, qIdx) => {
            return (
              <div
                key={question.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm transition"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {question.question_text}
                    </h2>
                    <span className="text-[11px] font-medium text-slate-400">
                      {question.question_type === 'true_false' ? 'True / False' : 'Select one choice'}
                    </span>
                  </div>
                </div>

                {/* Choices (Large 44px+ touch targets for mobile) */}
                <div className="space-y-3">
                  {question.choices.map((choice) => {
                    const isSelected = selectedAnswers[question.id] === choice.id;
                    return (
                      <label
                        key={choice.id}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={choice.id}
                          checked={isSelected}
                          onChange={() => handleSelectChoice(question.id, choice.id)}
                          className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <span className="flex-1 leading-snug">{choice.choice_text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="pt-2 pb-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting your response...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Response</span>
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Your response is submitted anonymously.
            </p>
          </div>
        </form>
      </div>

      <footer className="text-center text-xs text-slate-400 py-4">
        Classroom Survey Web App
      </footer>
    </div>
  );
};
