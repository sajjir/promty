// src/server/domain/Event.ts

export type AppEventType =
  | "PROMPT_CREATED"
  | "PROMPT_UPDATED"
  | "PROMPT_DELETED"
  | "TAXONOMY_CREATED"
  | "TAXONOMY_UPDATED"
  | "SEARCH_PERFORMED"
  | "AI_CLASSIFICATION_TRIGGERED";

export interface AppEvent<T = any> {
  id: string;
  type: AppEventType;
  timestamp: string;
  payload: T;
  userId?: string;
}

export interface IEventHandler {
  handle(event: AppEvent): Promise<void>;
}
