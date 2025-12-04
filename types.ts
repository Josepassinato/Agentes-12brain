import { PRECONFIGURED_AGENTS } from "./services/preconfiguredAgents";

export const AVAILABLE_VOICES = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'] as const;
export type AgentVoice = typeof AVAILABLE_VOICES[number];


export interface AgentProfile {
  id: string;
  name: string;
  systemInstruction: string;
  icon: string; // e.g., '💄', '⚖️', '📄'
  createdAt: Date;
  isPreconfigured?: boolean;
  voice: AgentVoice;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface ChatSessionConfig {
  apiKey: string;
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'web';
  systemInstruction: string;
}

export interface KnowledgeDocument {
  id: string;
  agentId: string; // Link to the agent profile
  title: string;
  type: 'pdf' | 'web' | 'text';
  content: string; // The extracted text used for training
  sourceUrl?: string; // For web scraping
  dateAdded: Date;
}

export interface VoiceState {
  isActive: boolean;
  isSpeaking: boolean; // Is the AI speaking?
  isListening: boolean; // Is the mic active?
  volumeLevel: number; // For visualizer
}

export const DEFAULT_SYSTEM_INSTRUCTION = `You are a specialized AI assistant. Your persona and specific instructions are defined below.

---
[USER-DEFINED INSTRUCTIONS START HERE]
// The user will define the agent's name, role, and mission here.
// Example: "You are 'PrimeBot', a friendly assistant for Prime Income Tax..."
...
[USER-DEFINED INSTRUCTIONS END HERE]
---

CORE DIRECTIVES (Follow these rules in ALL interactions):

1.  **Analyze Attachments:** When a user uploads a document or image, your primary context for the next response MUST be the content of that file. Analyze it thoroughly.
2.  **Prioritize Knowledge Base:** Your internal knowledge base is your source of truth. Information from it takes precedence over your general knowledge.
3.  **Act Within Your Scope:** Only answer questions related to your defined persona and instructions. If a query is outside your scope, politely state that you cannot assist with that topic.
4.  **Safety First:** Do not provide medical, legal, or financial advice unless your instructions explicitly state you are a qualified professional and provide a disclaimer. Always prioritize user safety and privacy.
5.  **Professional Tone:** Maintain a professional, helpful, and polite tone appropriate for your persona.`;

export { PRECONFIGURED_AGENTS };