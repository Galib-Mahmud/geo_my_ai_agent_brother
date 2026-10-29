import axios from 'axios';
import { config } from '../config.js';

export async function generateGroqReply(messages) {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }

  const response = await axios.post(
    `${config.groq.baseUrl}/chat/completions`,
    {
      model: config.groq.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 600,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Empty response from Groq API');
  }

  return reply.trim();
}
