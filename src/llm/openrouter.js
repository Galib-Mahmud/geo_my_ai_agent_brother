import axios from 'axios';
import { config } from '../config.js';

export async function generateOpenRouterReply(messages) {
  if (!config.openrouter.apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  const payload = {
    model: config.openrouter.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 600,
  };

  const response = await axios.post(
    `${config.openrouter.baseUrl}/chat/completions`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Galib-Mahmud/geo_my_ai_agent_brother',
        'X-Title': 'Geo AI Brother WhatsApp Agent',
      },
      timeout: 30000,
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Empty response from OpenRouter API');
  }

  return reply.trim();
}
