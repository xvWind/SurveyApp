import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataService } from '../lib/dataService';
import { QuestionType } from '../types/database';
import {
  ArrowLeft,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Play,
  Save,
  AlertCircle
} from 'lucide-react';

interface EditableChoice {
  id?: string;
  choice_text: string;
  position: number;
}

interface EditableQuestion {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  position: number;
  choices: EditableChoice[];
}

export const SurveyEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'closed' | 'archived'>('draft');
  const [questions, setQuestions] = useState<EditableQuestion[]>([
    {
      question_text: '',
      question_type: 'multiple_choice',
      position: 1,
      choices: [
        { choice_text: '', position: 1 },
        { choice_text: '', position: 2 }
      ]
    }
  ]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      DataService.getSurveyById(id).then((survey) => {
        if (!survey) {
          setError('Survey not found');
          setLoading(false);
          return;
        }

        if (survey.status === 'active') {
          setError('Cannot edit an active survey. Please close or duplicate it first.');
        }

        setTitle(survey.title);
        setDescription(survey.description || '');
        setStatus(survey.status);

        if (survey.questions && survey.questions.length > 0) {
          setQuestions(
            survey.questions.map((q, idx) => ({
              id: q.id,
              question_text: q.question_text,
              question_type: q.question_type,
              position: idx + 1,
              choices: (q.choices || []).map((c, cIdx) => ({
                id: c.id,
                choice_text: c.choice_text,
                position: cIdx + 1
              }))
            }))
          );
        }
        setLoading(false);
      });
    }
  }, [id]);

  // Question Management
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        position: questions.length + 1,
        choices: [
          { choice_text: '', position: 1 },
          { choice_text: '', position: 2 }
        ]
      }
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      alert('A survey must have at least one question.');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== qIndex);
    setQuestions(updated.map((q, idx) => ({ ...q, position: idx + 1 })));
  };

  const moveQuestion = (qIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? qIndex - 1 : qIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const copy = [...questions];
    const temp = copy[qIndex];
    copy[qIndex] = copy[targetIndex];
    copy[targetIndex] = temp;
    setQuestions(copy.map((q, idx) => ({ ...q, position: idx + 1 })));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    const copy = [...questions];
    copy[qIndex].question_text = text;
    setQuestions(copy);
  };

  const handleQuestionTypeChange = (qIndex: number, type: QuestionType) => {
    const copy = [...questions];
    copy[qIndex].question_type = type;

    if (type === 'true_false') {
      copy[qIndex].choices = [
        { choice_text: 'True', position: 1 },
        { choice_text: 'False', position: 2 }
      ];
    } else if (copy[qIndex].choices.length < 2) {
      copy[qIndex].choices = [
        { choice_text: '', position: 1 },
        { choice_text: '', position: 2 }
      ];
    }
    setQuestions(copy);
  };

  // Choice Management
  const addChoice = (qIndex: number) => {
    const copy = [...questions];
    const choices = copy[qIndex].choices;
    choices.push({
      choice_text: '',
      position: choices.length + 1
    });
    setQuestions(copy);
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    const copy = [...questions];
    if (copy[qIndex].choices.length <= 2) {
      alert('Multiple-choice questions must have at least two choices.');
      return;
    }
    copy[qIndex].choices = copy[qIndex].choices.filter((_, idx) => idx !== cIndex);
    copy[qIndex].choices.forEach((c, idx) => {
      c.position = idx + 1;
    });
    setQuestions(copy);
  };

  const handleChoiceTextChange = (qIndex: number, cIndex: number, text: string) => {
    const copy = [...questions];
    copy[qIndex].choices[cIndex].choice_text = text;
    setQuestions(copy);
  };

  // Validation
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Please provide a title for the survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    if (questions.length === 0) {
      setError('Please add at least one question.');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} text cannot be empty.`);
        return false;
      }

      if (q.choices.length < 2) {
        setError(`Question ${i + 1} must have at least two choices.`);
        return false;
      }

      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].choice_text.trim()) {
          setError(`Question ${i + 1}, Choice ${j + 1} text cannot be empty.`);
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleSave = async (activateImmediately: boolean = false) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const saved = await DataService.saveSurvey(
        {
          id: id,
          title: title.trim(),
          description: description.trim() || null,
          status: status
        },
        questions.map((q, idx) => ({
          id: q.id,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          position: idx + 1,
          choices: q.choices.map((c, cIdx) => ({
            id: c.id,
            choice_text: c.choice_text.trim(),
            position: cIdx + 1
          }))
        }))
      );

      if (activateImmediately) {
        await DataService.activateSurvey(saved.id);
        navigate(`/surveys/${saved.id}/present`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm">Loading survey editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & Header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Survey' : 'Create New Survey'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Save & Activate
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Survey Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Survey Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Recursion Concept Check, Week 4 Review"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Description <span className="text-slate-400 font-normal">(optional instructions for students)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Answer individually without consulting notes."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
          />
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Questions ({questions.length})
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all"
          >
            {/* Question Header & Order Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <span className="font-semibold text-slate-800 text-sm">Question {qIndex + 1}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Move question up"
                  disabled={qIndex === 0}
                  onClick={() => moveQuestion(qIndex, 'up')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition disabled:opacity-30"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Move question down"
                  disabled={qIndex === questions.length - 1}
                  onClick={() => moveQuestion(qIndex, 'down')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition disabled:opacity-30"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Delete question"
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Body */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Prompt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="e.g. What is the time complexity of binary search?"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
                />
              </div>

              <div className="sm:w-64">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Type
                </label>
                <select
                  value={q.question_type}
                  onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as QuestionType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>

              {/* Choices Sub-Section */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Answer Choices
                </label>

                <div className="space-y-2.5">
                  {q.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-400 w-5 text-right">
                        {String.fromCharCode(65 + cIndex)}.
                      </span>
                      <input
                        type="text"
                        value={choice.choice_text}
                        disabled={q.question_type === 'true_false'}
                        onChange={(e) => handleChoiceTextChange(qIndex, cIndex, e.target.value)}
                        placeholder={`Choice ${cIndex + 1}`}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm transition ${
                          q.question_type === 'true_false'
                            ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      />
                      {q.question_type !== 'true_false' && (
                        <button
                          type="button"
                          onClick={() => removeChoice(qIndex, cIndex)}
                          title="Remove choice"
                          disabled={q.choices.length <= 2}
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded transition disabled:opacity-20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {q.question_type !== 'true_false' && (
                  <button
                    type="button"
                    onClick={() => addChoice(qIndex)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Choice
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-semibold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Another Question
          </button>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Save & Activate
          </button>
        </div>
      </div>
    </div>
  );
};
