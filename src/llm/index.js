import { config } from '../config.js';
import { generateOpenRouterReply } from './openrouter.js';
import { generateGeminiReply } from './gemini.js';
import { generateGroqReply } from './groq.js';

export async function generateAIReply(messages) {
  const provider = config.llmProvider;

  try {
    if (provider === 'gemini' && config.gemini.apiKey) {
      return await generateGeminiReply(messages);
    } else if (provider === 'groq' && config.groq.apiKey) {
      return await generateGroqReply(messages);
    } else if (config.openrouter.apiKey) {
      return await generateOpenRouterReply(messages);
    }
  } catch (primaryErr) {
    console.warn(`[LLM Router] Primary provider (${provider}) failed: ${primaryErr.message}`);

    // Automatic fallback to any other available provider
    if (provider !== 'openrouter' && config.openrouter.apiKey) {
      console.log('[LLM Router] Falling back to OpenRouter...');
      return await generateOpenRouterReply(messages);
    }
    if (provider !== 'gemini' && config.gemini.apiKey) {
      console.log('[LLM Router] Falling back to Gemini...');
      return await generateGeminiReply(messages);
    }
    if (provider !== 'groq' && config.groq.apiKey) {
      console.log('[LLM Router] Falling back to Groq...');
      return await generateGroqReply(messages);
    }

    throw primaryErr;
  }

  // If no API key is provided at all, return a polite instructional message
  return `Hey there! I am ${config.agentName}, ${config.ownerName}'s AI brother. My AI Brain key is not set yet in the environment variables. Please set OPENROUTER_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in Render/ENV!`;
}
