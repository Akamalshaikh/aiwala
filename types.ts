export type Role = 'user' | 'ai';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
  model: string;
}

export const AVAILABLE_MODELS = [
  "claude-sonnet-4.5",
  "gpt-5",
  "grok-4",
  "gemini-2.5-pro",
  "kyvex",
  "kyvex-labs-deep-research",
  "gemini-imagen-4"
];

// Declaration for the external marked library
declare global {
  interface Window {
    marked: {
      parse: (text: string) => string;
    };
  }
}