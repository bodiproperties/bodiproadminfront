export type AIAction = "translate" | "summarize" | "seo" | "improve";

export interface TranslateResult {
  title_en: string;
  content_en: string;
}

export interface SummarizeResult {
  summary_mn: string;
  summary_en: string;
}

export interface SeoResult {
  meta_title: string;
  meta_description: string;
}

export interface ImproveResult {
  improved_content: string;
}

export type AIAssistResult =
  | TranslateResult
  | SummarizeResult
  | SeoResult
  | ImproveResult;

export interface AIAssistResponse {
  success: boolean;
  data?: AIAssistResult;
  error?: string;
}