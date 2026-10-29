import dotenv from 'dotenv';
dotenv.config();

function cleanKey(val) {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
}

import fs from 'fs';
import path from 'path';

function loadPersistedSettings() {
  try {
    const file = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

const saved = loadPersistedSettings();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  agentName: process.env.AGENT_NAME || 'Geo',
  ownerName: process.env.OWNER_NAME || 'Galib Mahmud',

  // LLM settings
  llmProvider: (process.env.LLM_PROVIDER || 'openrouter').toLowerCase(),
  
  openrouter: {
    apiKey: cleanKey(process.env.OPENROUTER_API_KEY || saved.openrouterApiKey),
    model: (() => {
      const m = (process.env.OPENROUTER_MODEL || saved.openrouterModel || 'openrouter/free').trim();
      return m.includes('405b:free') ? 'openrouter/free' : m;
    })(),
    baseUrl: 'https://openrouter.ai/api/v1',
  },

  gemini: {
    apiKey: cleanKey(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  groq: {
    apiKey: cleanKey(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  },

  // Database for session persistence
  mongodbUri: (process.env.MONGODB_URI || '').trim(),

  // Render & Keep Alive
  renderExternalUrl: (process.env.RENDER_EXTERNAL_URL || '').trim(),

  // Automation flags
  replyToGroups: process.env.REPLY_TO_GROUPS === 'true',
  replyToSelf: process.env.REPLY_TO_SELF !== 'false', // Default true for testing
  typingDelayMs: parseInt(process.env.TYPING_DELAY_MS || '1500', 10),
};
