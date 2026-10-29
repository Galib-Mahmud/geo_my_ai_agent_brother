import axios from 'axios';
import { config } from '../config.js';

export async function generateGeminiReply(messages) {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  // Google provides an OpenAI-compatible chat completions endpoint
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        model: config.gemini.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 600,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.gemini.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (reply) return reply.trim();
  } catch (err) {
    // Fallback to Gemini native REST API if OpenAI-compat fails
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    const nativeRes = await axios.post(
      nativeUrl,
      {
        contents: userHistory,
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      },
      { timeout: 30000 }
    );

    const text = nativeRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text.trim();
    throw err;
  }

  throw new Error('Empty response from Google Gemini API');
}
