import axios from 'axios';
import { config, VERIFIED_FALLBACK_KEY } from '../config.js';

const FALLBACK_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free',
];

export async function generateOpenRouterReply(messages) {
  let activeKey = config.openrouter.apiKey || VERIFIED_FALLBACK_KEY;

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
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/Galib-Mahmud/geo_my_ai_agent_brother',
            'X-Title': 'Geo AI Brother WhatsApp Agent',
          },
          timeout: 25000,
        }
      );

      const rawReply = response.data?.choices?.[0]?.message?.content;
      if (rawReply && rawReply.trim()) {
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
      const status = err.response?.status;
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[OpenRouter] Model "${model}" failed (HTTP ${status}: ${errMsg}).`);
      lastError = err;

      // If 401 Unauthorized occurs, self-heal by switching to verified key and retrying!
      if (status === 401 && activeKey !== VERIFIED_FALLBACK_KEY) {
        console.log('[OpenRouter] 401 detected! Auto-switching to verified key...');
        activeKey = VERIFIED_FALLBACK_KEY;
        config.openrouter.apiKey = VERIFIED_FALLBACK_KEY;
        // Retry this model immediately with verified key
        try {
          const retryRes = await axios.post(
            `${config.openrouter.baseUrl}/chat/completions`,
            {
              model: model,
              messages: messages,
              temperature: 0.7,
              max_tokens: 600,
            },
            {
              headers: {
                'Authorization': `Bearer ${activeKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/Galib-Mahmud/geo_my_ai_agent_brother',
                'X-Title': 'Geo AI Brother WhatsApp Agent',
              },
              timeout: 25000,
            }
          );
          const retryReply = retryRes.data?.choices?.[0]?.message?.content;
          if (retryReply && retryReply.trim()) {
            return retryReply
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
              .trim();
          }
        } catch (retryErr) {
          console.warn('[OpenRouter] Retry with verified key also failed on model:', model);
        }
      }
    }
  }

  const errDetails = JSON.stringify(lastError?.response?.data) || lastError?.message || 'unknown';
  throw new Error(`All OpenRouter free models failed. Last error: ${errDetails}`);
}
