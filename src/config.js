import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  agentName: process.env.AGENT_NAME || 'Geo',
  ownerName: process.env.OWNER_NAME || 'Galib Mahmud',

  // LLM settings
  llmProvider: (process.env.LLM_PROVIDER || 'openrouter').toLowerCase(),
  
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'nousresearch/hermes-3-llama-3.1-405b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  },

  // Database for session persistence
  mongodbUri: process.env.MONGODB_URI || '',

  // Render & Keep Alive
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL || '',

  // Automation flags
  replyToGroups: process.env.REPLY_TO_GROUPS === 'true',
  replyToSelf: process.env.REPLY_TO_SELF === 'true',
  typingDelayMs: parseInt(process.env.TYPING_DELAY_MS || '2000', 10),
};
