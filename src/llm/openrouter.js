import axios from 'axios';
import { config } from '../config.js';

const FALLBACK_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free',
];

export async function generateOpenRouterReply(messages) {
  if (!config.openrouter.apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Build candidate model list starting with configured model
  const primaryModel = config.openrouter.model || 'openrouter/free';
  const modelsToTry = [
    primaryModel,
    ...FALLBACK_FREE_MODELS.filter(m => m !== primaryModel),
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[OpenRouter] Requesting completion with model: "${model}"...`);

      const response = await axios.post(
        `${config.openrouter.baseUrl}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 600,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openrouter.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/Galib-Mahmud/geo_my_ai_agent_brother',
            'X-Title': 'Geo AI Brother WhatsApp Agent',
          },
          timeout: 25000,
        }
      );

      const rawReply = response.data?.choices?.[0]?.message?.content;
      if (rawReply && rawReply.trim()) {
        // Strip reasoning/thinking tags if model returned <think>...</think>
        const cleanReply = rawReply
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
          .trim();

        if (cleanReply) {
          console.log(`[OpenRouter] Successfully generated reply using model: "${model}"`);
          return cleanReply;
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[OpenRouter] Model "${model}" failed (${errMsg}). Trying next available model...`);
      lastError = err;
    }
  }

  throw new Error(`All OpenRouter free models failed. Last error: ${lastError?.message || 'unknown'}`);
}
