import { supabase, isSupabaseConfigured } from './supabase';
import {
  Survey,
  SurveyWithQuestions,
  SurveyResults,
  Choice,
  Question,
  ResponseRecord,
  AnswerRecord
} from '../types/database';

const STORAGE_KEYS = {
  SURVEYS: 'classroom_survey_surveys',
  QUESTIONS: 'classroom_survey_questions',
  CHOICES: 'classroom_survey_choices',
  RESPONSES: 'classroom_survey_responses',
  ANSWERS: 'classroom_survey_answers',
  STUDENT_TOKEN: 'classroom_survey_student_token'
};

// Generate random short slug
function generateShortSlug(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Anonymous token management
export function getOrCreateStudentToken(): string {
  let token = localStorage.getItem(STORAGE_KEYS.STUDENT_TOKEN);
  if (!token) {
    token = 'anon_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(STORAGE_KEYS.STUDENT_TOKEN, token);
  }
  return token;
}

// Initial mock data
function initializeMockData() {
  if (localStorage.getItem(STORAGE_KEYS.SURVEYS)) return;

  const mockSurveys: Survey[] = [
    {
      id: 's-recursion-101',
      title: 'Recursion Concept Check',
      description: 'Quick in-class understanding check on recursive call mechanics and base cases.',
      status: 'active',
      public_slug: 'rec101',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 's-pointers-201',
      title: 'Pointers & Dynamic Memory Review',
      description: 'Understanding pointers, heap allocation, and address-of operators.',
      status: 'closed',
      public_slug: 'ptr201',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 's-complexity-301',
      title: 'Big-O Asymptotic Complexity',
      description: 'Draft survey for tomorrow morning lecture on sorting algorithm complexities.',
      status: 'draft',
      public_slug: null,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ];

  const mockQuestions: Question[] = [
    {
      id: 'q-rec-1',
      survey_id: 's-recursion-101',
      question_text: 'What is strictly required for a recursive function to prevent an infinite call stack?',
      question_type: 'multiple_choice',
      position: 1
    },
    {
      id: 'q-rec-2',
      survey_id: 's-recursion-101',
      question_text: 'Every recursive algorithm can theoretically be rewritten using an iterative loop and a stack.',
      question_type: 'true_false',
      position: 2
    },
    {
      id: 'q-ptr-1',
      survey_id: 's-pointers-201',
      question_text: 'Which operator is used to obtain the address of a variable in C/C++?',
      question_type: 'multiple_choice',
      position: 1
    }
  ];

  const mockChoices: Choice[] = [
    { id: 'c-rec-1-1', question_id: 'q-rec-1', choice_text: 'A base case that halts recursion', position: 1 },
    { id: 'c-rec-1-2', question_id: 'q-rec-1', choice_text: 'A global loop variable', position: 2 },
    { id: 'c-rec-1-3', question_id: 'q-rec-1', choice_text: 'A compiler optimization flag', position: 3 },
    { id: 'c-rec-1-4', question_id: 'q-rec-1', choice_text: 'Tail call elimination support', position: 4 },

    { id: 'c-rec-2-1', question_id: 'q-rec-2', choice_text: 'True', position: 1 },
    { id: 'c-rec-2-2', question_id: 'q-rec-2', choice_text: 'False', position: 2 },

    { id: 'c-ptr-1-1', question_id: 'q-ptr-1', choice_text: '& (address-of operator)', position: 1 },
    { id: 'c-ptr-1-2', question_id: 'q-ptr-1', choice_text: '* (dereference operator)', position: 2 },
    { id: 'c-ptr-1-3', question_id: 'q-ptr-1', choice_text: '-> (member access operator)', position: 3 }
  ];

  const mockResponses: ResponseRecord[] = [
    { id: 'r-1', survey_id: 's-recursion-101', anonymous_token: 'student_1', submitted_at: new Date(Date.now() - 1500000).toISOString() },
    { id: 'r-2', survey_id: 's-recursion-101', anonymous_token: 'student_2', submitted_at: new Date(Date.now() - 1200000).toISOString() },
    { id: 'r-3', survey_id: 's-recursion-101', anonymous_token: 'student_3', submitted_at: new Date(Date.now() - 900000).toISOString() },
    { id: 'r-4', survey_id: 's-recursion-101', anonymous_token: 'student_4', submitted_at: new Date(Date.now() - 600000).toISOString() },
    { id: 'r-5', survey_id: 's-recursion-101', anonymous_token: 'student_5', submitted_at: new Date(Date.now() - 300000).toISOString() },
    
    { id: 'r-6', survey_id: 's-pointers-201', anonymous_token: 'student_6', submitted_at: new Date(Date.now() - 86000000).toISOString() }
  ];

  const mockAnswers: AnswerRecord[] = [
    { id: 'a-1', response_id: 'r-1', question_id: 'q-rec-1', choice_id: 'c-rec-1-1', text_answer: null, created_at: new Date().toISOString() },
    { id: 'a-2', response_id: 'r-1', question_id: 'q-rec-2', choice_id: 'c-rec-2-1', text_answer: null, created_at: new Date().toISOString() },

    { id: 'a-3', response_id: 'r-2', question_id: 'q-rec-1', choice_id: 'c-rec-1-1', text_answer: null, created_at: new Date().toISOString() },
    { id: 'a-4', response_id: 'r-2', question_id: 'q-rec-2', choice_id: 'c-rec-2-1', text_answer: null, created_at: new Date().toISOString() },

    { id: 'a-5', response_id: 'r-3', question_id: 'q-rec-1', choice_id: 'c-rec-1-1', text_answer: null, created_at: new Date().toISOString() },
    { id: 'a-6', response_id: 'r-3', question_id: 'q-rec-2', choice_id: 'c-rec-2-2', text_answer: null, created_at: new Date().toISOString() },

    { id: 'a-7', response_id: 'r-4', question_id: 'q-rec-1', choice_id: 'c-rec-1-2', text_answer: null, created_at: new Date().toISOString() },
    { id: 'a-8', response_id: 'r-4', question_id: 'q-rec-2', choice_id: 'c-rec-2-1', text_answer: null, created_at: new Date().toISOString() },

    { id: 'a-9', response_id: 'r-5', question_id: 'q-rec-1', choice_id: 'c-rec-1-1', text_answer: null, created_at: new Date().toISOString() },
    { id: 'a-10', response_id: 'r-5', question_id: 'q-rec-2', choice_id: 'c-rec-2-1', text_answer: null, created_at: new Date().toISOString() },

    { id: 'a-11', response_id: 'r-6', question_id: 'q-ptr-1', choice_id: 'c-ptr-1-1', text_answer: null, created_at: new Date().toISOString() }
  ];

  localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(mockSurveys));
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(mockQuestions));
  localStorage.setItem(STORAGE_KEYS.CHOICES, JSON.stringify(mockChoices));
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(mockResponses));
  localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(mockAnswers));
}

// Initialize on file load
initializeMockData();

// Storage helper functions
function getStored<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function setStored<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const DataService = {
  // 1. List all surveys
  async listSurveys(): Promise<Survey[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getStored<Survey>(STORAGE_KEYS.SURVEYS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // 2. Get survey by ID with questions and choices
  async getSurveyById(id: string): Promise<SurveyWithQuestions | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();
      if (surveyError || !survey) return null;

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', id)
        .order('position', { ascending: true });
      if (qError) throw qError;

      const questionIds = (questions || []).map((q) => q.id);
      let choices: Choice[] = [];
      if (questionIds.length > 0) {
        const { data: cData, error: cError } = await supabase
          .from('choices')
          .select('*')
          .in('question_id', questionIds)
          .order('position', { ascending: true });
        if (cError) throw cError;
        choices = cData || [];
      }

      const questionsWithChoices = (questions || []).map((q) => ({
        ...q,
        choices: choices.filter((c) => c.question_id === q.id)
      }));

      return {
        ...survey,
        questions: questionsWithChoices
      };
    }

    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const survey = surveys.find((s) => s.id === id);
    if (!survey) return null;

    const questions = getStored<Question>(STORAGE_KEYS.QUESTIONS)
      .filter((q) => q.survey_id === id)
      .sort((a, b) => a.position - b.position);

    const allChoices = getStored<Choice>(STORAGE_KEYS.CHOICES);
    const questionsWithChoices = questions.map((q) => ({
      ...q,
      choices: allChoices
        .filter((c) => c.question_id === q.id)
        .sort((a, b) => a.position - b.position)
    }));

    return {
      ...survey,
      questions: questionsWithChoices
    };
  },

  // 3. Resolve public survey by slug or ID
  async getPublicSurvey(identifier: string): Promise<SurveyWithQuestions | null> {
    if (isSupabaseConfigured && supabase) {
      // Find active survey by slug or id
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select('*')
        .or(`public_slug.eq.${identifier},id.eq.${identifier}`)
        .eq('status', 'active')
        .limit(1);

      if (error || !surveys || surveys.length === 0) return null;
      return this.getSurveyById(surveys[0].id);
    }

    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const survey = surveys.find(
      (s) => (s.public_slug === identifier || s.id === identifier) && s.status === 'active'
    );
    if (!survey) return null;
    return this.getSurveyById(survey.id);
  },

  // 4. Save or update survey with questions and choices
  async saveSurvey(
    surveyData: { id?: string; title: string; description: string | null; status?: string },
    questions: Array<{
      id?: string;
      question_text: string;
      question_type: 'multiple_choice' | 'true_false';
      position: number;
      choices: Array<{ id?: string; choice_text: string; position: number }>;
    }>
  ): Promise<SurveyWithQuestions> {
    if (isSupabaseConfigured && supabase) {
      let surveyId = surveyData.id;
      if (!surveyId) {
        const { data, error } = await supabase
          .from('surveys')
          .insert({
            title: surveyData.title,
            description: surveyData.description,
            status: 'draft'
          })
          .select()
          .single();
        if (error) throw error;
        surveyId = data.id;
      } else {
        const { error } = await supabase
          .from('surveys')
          .update({
            title: surveyData.title,
            description: surveyData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', surveyId);
        if (error) throw error;
      }

      // Delete existing questions & recreate for clean ordering
      await supabase.from('questions').delete().eq('survey_id', surveyId);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .insert({
            survey_id: surveyId,
            question_text: q.question_text,
            question_type: q.question_type,
            position: i + 1
          })
          .select()
          .single();
        if (qError) throw qError;

        if (q.choices && q.choices.length > 0) {
          const choicesToInsert = q.choices.map((c, cIdx) => ({
            question_id: qData.id,
            choice_text: c.choice_text,
            position: cIdx + 1
          }));
          const { error: cError } = await supabase.from('choices').insert(choicesToInsert);
          if (cError) throw cError;
        }
      }

      const saved = await this.getSurveyById(surveyId!);
      return saved!;
    }

    // LocalStorage mode
    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    let allQuestions = getStored<Question>(STORAGE_KEYS.QUESTIONS);
    let allChoices = getStored<Choice>(STORAGE_KEYS.CHOICES);

    let surveyId = surveyData.id;
    if (!surveyId) {
      surveyId = 's-' + Math.random().toString(36).substring(2, 9);
      const newSurvey: Survey = {
        id: surveyId,
        title: surveyData.title,
        description: surveyData.description,
        status: 'draft',
        public_slug: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      surveys.unshift(newSurvey);
    } else {
      const idx = surveys.findIndex((s) => s.id === surveyId);
      if (idx !== -1) {
        surveys[idx] = {
          ...surveys[idx],
          title: surveyData.title,
          description: surveyData.description,
          updated_at: new Date().toISOString()
        };
      }
    }
    setStored(STORAGE_KEYS.SURVEYS, surveys);

    // Filter out existing questions and choices for this survey
    const oldQIds = allQuestions.filter((q) => q.survey_id === surveyId).map((q) => q.id);
    allQuestions = allQuestions.filter((q) => q.survey_id !== surveyId);
    allChoices = allChoices.filter((c) => !oldQIds.includes(c.question_id));

    // Insert new questions & choices
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qId = q.id || 'q-' + Math.random().toString(36).substring(2, 9);
      allQuestions.push({
        id: qId,
        survey_id: surveyId,
        question_text: q.question_text,
        question_type: q.question_type,
        position: i + 1
      });

      if (q.choices) {
        q.choices.forEach((c, cIdx) => {
          allChoices.push({
            id: c.id || 'c-' + Math.random().toString(36).substring(2, 9),
            question_id: qId,
            choice_text: c.choice_text,
            position: cIdx + 1
          });
        });
      }
    }

    setStored(STORAGE_KEYS.QUESTIONS, allQuestions);
    setStored(STORAGE_KEYS.CHOICES, allChoices);

    const result = await this.getSurveyById(surveyId);
    return result!;
  },

  // 5. Activate survey (Ensures at most ONE active survey)
  async activateSurvey(surveyId: string): Promise<Survey> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('activate_survey', { p_survey_id: surveyId });
      if (error) throw error;
      const updated = await this.getSurveyById(surveyId);
      return updated!;
    }

    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const targetIdx = surveys.findIndex((s) => s.id === surveyId);
    if (targetIdx === -1) throw new Error('Survey not found');

    // Close any currently active survey
    surveys.forEach((s) => {
      if (s.status === 'active' && s.id !== surveyId) {
        s.status = 'closed';
        s.updated_at = new Date().toISOString();
      }
    });

    // Activate target survey and ensure slug
    const target = surveys[targetIdx];
    target.status = 'active';
    if (!target.public_slug) {
      target.public_slug = generateShortSlug();
    }
    target.updated_at = new Date().toISOString();

    setStored(STORAGE_KEYS.SURVEYS, surveys);
    return target;
  },

  // 6. Close survey
  async closeSurvey(surveyId: string): Promise<Survey> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('close_survey', { p_survey_id: surveyId });
      if (error) throw error;
      const updated = await this.getSurveyById(surveyId);
      return updated!;
    }

    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const target = surveys.find((s) => s.id === surveyId);
    if (!target) throw new Error('Survey not found');

    target.status = 'closed';
    target.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.SURVEYS, surveys);
    return target;
  },

  // 7. Duplicate survey
  async duplicateSurvey(surveyId: string): Promise<SurveyWithQuestions> {
    const original = await this.getSurveyById(surveyId);
    if (!original) throw new Error('Original survey not found');

    const duplicateQuestions = original.questions.map((q) => ({
      question_text: q.question_text,
      question_type: q.question_type,
      position: q.position,
      choices: (q.choices || []).map((c) => ({
        choice_text: c.choice_text,
        position: c.position
      }))
    }));

    return this.saveSurvey(
      {
        title: `Copy of ${original.title}`,
        description: original.description
      },
      duplicateQuestions
    );
  },

  // 8. Archive survey
  async archiveSurvey(surveyId: string): Promise<Survey> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('surveys')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', surveyId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const target = surveys.find((s) => s.id === surveyId);
    if (!target) throw new Error('Survey not found');

    target.status = 'archived';
    target.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.SURVEYS, surveys);
    return target;
  },

  // 9. Delete survey
  async deleteSurvey(surveyId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('surveys').delete().eq('id', surveyId);
      if (error) throw error;
      return;
    }

    let surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    surveys = surveys.filter((s) => s.id !== surveyId);
    setStored(STORAGE_KEYS.SURVEYS, surveys);

    // Cascades
    let questions = getStored<Question>(STORAGE_KEYS.QUESTIONS);
    const qIds = questions.filter((q) => q.survey_id === surveyId).map((q) => q.id);
    questions = questions.filter((q) => q.survey_id !== surveyId);
    setStored(STORAGE_KEYS.QUESTIONS, questions);

    let choices = getStored<Choice>(STORAGE_KEYS.CHOICES);
    choices = choices.filter((c) => !qIds.includes(c.question_id));
    setStored(STORAGE_KEYS.CHOICES, choices);

    let responses = getStored<ResponseRecord>(STORAGE_KEYS.RESPONSES);
    const rIds = responses.filter((r) => r.survey_id === surveyId).map((r) => r.id);
    responses = responses.filter((r) => r.survey_id !== surveyId);
    setStored(STORAGE_KEYS.RESPONSES, responses);

    let answers = getStored<AnswerRecord>(STORAGE_KEYS.ANSWERS);
    answers = answers.filter((a) => !rIds.includes(a.response_id));
    setStored(STORAGE_KEYS.ANSWERS, answers);
  },

  // 10. Check if student already submitted to survey
  async hasStudentSubmitted(surveyId: string, token: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('responses')
        .select('id')
        .eq('survey_id', surveyId)
        .eq('anonymous_token', token)
        .limit(1);
      if (error) return false;
      return Boolean(data && data.length > 0);
    }

    const responses = getStored<ResponseRecord>(STORAGE_KEYS.RESPONSES);
    return responses.some((r) => r.survey_id === surveyId && r.anonymous_token === token);
  },

  // 11. Submit student response
  async submitResponse(
    surveyId: string,
    anonymousToken: string,
    answers: Array<{ question_id: string; choice_id: string }>
  ): Promise<{ success: boolean; response_id?: string; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('submit_survey_response', {
        p_survey_id: surveyId,
        p_anonymous_token: anonymousToken,
        p_answers: answers
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, response_id: data.response_id };
    }

    // Mock validation
    const surveys = getStored<Survey>(STORAGE_KEYS.SURVEYS);
    const survey = surveys.find((s) => s.id === surveyId);
    if (!survey) return { success: false, error: 'SURVEY_NOT_FOUND' };
    if (survey.status !== 'active') return { success: false, error: 'SURVEY_NOT_ACTIVE' };

    const responses = getStored<ResponseRecord>(STORAGE_KEYS.RESPONSES);
    if (responses.some((r) => r.survey_id === surveyId && r.anonymous_token === anonymousToken)) {
      return { success: false, error: 'DUPLICATE_RESPONSE' };
    }

    const responseId = 'r-' + Math.random().toString(36).substring(2, 9);
    responses.push({
      id: responseId,
      survey_id: surveyId,
      anonymous_token: anonymousToken,
      submitted_at: new Date().toISOString()
    });
    setStored(STORAGE_KEYS.RESPONSES, responses);

    const storedAnswers = getStored<AnswerRecord>(STORAGE_KEYS.ANSWERS);
    answers.forEach((ans) => {
      storedAnswers.push({
        id: 'a-' + Math.random().toString(36).substring(2, 9),
        response_id: responseId,
        question_id: ans.question_id,
        choice_id: ans.choice_id,
        text_answer: null,
        created_at: new Date().toISOString()
      });
    });
    setStored(STORAGE_KEYS.ANSWERS, storedAnswers);

    return { success: true, response_id: responseId };
  },

  // 12. Aggregate survey results for dashboard/charts
  async getSurveyResults(surveyId: string): Promise<SurveyResults | null> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) return null;

    let responses: ResponseRecord[] = [];
    let answers: AnswerRecord[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: rData } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_id', surveyId);
      responses = rData || [];

      const rIds = responses.map((r) => r.id);
      if (rIds.length > 0) {
        const { data: aData } = await supabase
          .from('answers')
          .select('*')
          .in('response_id', rIds);
        answers = aData || [];
      }
    } else {
      responses = getStored<ResponseRecord>(STORAGE_KEYS.RESPONSES).filter(
        (r) => r.survey_id === surveyId
      );
      const rIds = responses.map((r) => r.id);
      answers = getStored<AnswerRecord>(STORAGE_KEYS.ANSWERS).filter((a) =>
        rIds.includes(a.response_id)
      );
    }

    const totalResponses = responses.length;

    const questionResults = survey.questions.map((q) => {
      const qAnswers = answers.filter((a) => a.question_id === q.id);
      const qResponseCount = qAnswers.length;

      const choiceResults = (q.choices || []).map((c) => {
        const count = qAnswers.filter((a) => a.choice_id === c.id).length;
        const percentage =
          qResponseCount > 0 ? Math.round((count / qResponseCount) * 1000) / 10 : 0;
        return {
          choice_id: c.id,
          choice_text: c.choice_text,
          count,
          percentage
        };
      });

      return {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        position: q.position,
        response_count: qResponseCount,
        choices: choiceResults
      };
    });

    return {
      survey_id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      response_count: totalResponses,
      questions: questionResults
    };
  },

  // 13. Export Survey Data as CSV String
  async exportSurveyCsv(surveyId: string): Promise<string> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) throw new Error('Survey not found');

    let responses: ResponseRecord[] = [];
    let answers: AnswerRecord[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: rData } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('submitted_at', { ascending: true });
      responses = rData || [];

      const rIds = responses.map((r) => r.id);
      if (rIds.length > 0) {
        const { data: aData } = await supabase.from('answers').select('*').in('response_id', rIds);
        answers = aData || [];
      }
    } else {
      responses = getStored<ResponseRecord>(STORAGE_KEYS.RESPONSES)
        .filter((r) => r.survey_id === surveyId)
        .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
      const rIds = responses.map((r) => r.id);
      answers = getStored<AnswerRecord>(STORAGE_KEYS.ANSWERS).filter((a) =>
        rIds.includes(a.response_id)
      );
    }

    const choiceMap = new Map<string, string>();
    survey.questions.forEach((q) => {
      (q.choices || []).forEach((c) => {
        choiceMap.set(c.id, c.choice_text);
      });
    });

    // CSV Escape helper
    const escapeCsv = (str: string | null | undefined): string => {
      if (!str) return '""';
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    // Build header
    const headers = ['response_id', 'submitted_at'];
    survey.questions.forEach((q, idx) => {
      headers.push(`Q${idx + 1}: ${q.question_text}`);
    });

    const rows: string[] = [headers.map(escapeCsv).join(',')];

    responses.forEach((r) => {
      const rowCols = [r.id, r.submitted_at];
      survey.questions.forEach((q) => {
        const ans = answers.find((a) => a.response_id === r.id && a.question_id === q.id);
        if (ans && ans.choice_id) {
          rowCols.push(choiceMap.get(ans.choice_id) || 'Unknown Choice');
        } else if (ans && ans.text_answer) {
          rowCols.push(ans.text_answer);
        } else {
          rowCols.push('No Answer');
        }
      });
      rows.push(rowCols.map(escapeCsv).join(','));
    });

    return rows.join('\n');
  }
};
