export type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';
export type QuestionType = 'multiple_choice' | 'true_false';

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Choice {
  id: string;
  question_id: string;
  choice_text: string;
  position: number;
  created_at?: string;
}

export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  position: number;
  choices?: Choice[];
  created_at?: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: (Question & { choices: Choice[] })[];
}

export interface ResponseRecord {
  id: string;
  survey_id: string;
  anonymous_token: string | null;
  submitted_at: string;
}

export interface AnswerRecord {
  id: string;
  response_id: string;
  question_id: string;
  choice_id: string | null;
  text_answer: string | null;
  created_at: string;
}

export interface ChoiceResult {
  choice_id: string;
  choice_text: string;
  count: number;
  percentage: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  position: number;
  response_count: number;
  choices: ChoiceResult[];
}

export interface SurveyResults {
  survey_id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  response_count: number;
  questions: QuestionResult[];
}
