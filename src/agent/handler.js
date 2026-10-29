import { config } from '../config.js';
import { getSystemPrompt } from './persona.js';
import { getChatHistory, appendChatMessage } from './memory.js';
import { generateAIReply } from '../llm/index.js';

// Recent activity log buffer for Web Dashboard
export const recentActivities = [];
const MAX_LOGS = 50;

export function addActivityLog(log) {
  recentActivities.unshift({
    id: Date.now() + Math.random().toString(36).substring(7),
    timestamp: new Date().toLocaleTimeString(),
    ...log,
  });
  if (recentActivities.length > MAX_LOGS) {
    recentActivities.pop();
  }
}

export async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg.message) return;

    const key = msg.key;
    const fromMe = key.fromMe;
    const remoteJid = key.remoteJid;

    // 1. Filter out WhatsApp status stories
    if (remoteJid === 'status@broadcast') return;

    // 2. Filter out group messages if disabled
    const isGroup = remoteJid.endsWith('@g.us');
    if (isGroup && !config.replyToGroups) return;

    // 3. Filter out messages from self unless explicitly enabled
    if (fromMe && !config.replyToSelf) return;

    // 4. Extract incoming text content
    const messageContent = msg.message;
    const text =
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.imageMessage?.caption ||
      messageContent.videoMessage?.caption ||
      '';

    if (!text || !text.trim()) return;

    const senderName = msg.pushName || 'Friend';
    const cleanText = text.trim();

    console.log(`[WhatsApp Inbound] From ${senderName} (${remoteJid}): "${cleanText}"`);
    addActivityLog({
      type: 'inbound',
      sender: senderName,
      jid: remoteJid,
      text: cleanText,
    });

    // 5. Indicate typing in WhatsApp
    try {
      await sock.sendPresenceUpdate('composing', remoteJid);
    } catch (e) {
      // Non-fatal if presence update fails
    }

    // 6. Build prompt & conversation history
    const history = getChatHistory(remoteJid);
    const messages = [
      { role: 'system', content: getSystemPrompt(senderName) },
      ...history,
      { role: 'user', content: cleanText },
    ];

    // Optional delay to feel natural
    if (config.typingDelayMs > 0) {
      await new Promise(r => setTimeout(r, Math.min(config.typingDelayMs, 3000)));
    }

    // 7. Generate response from AI
    const replyText = await generateAIReply(messages);

    // Stop typing indicator
    try {
      await sock.sendPresenceUpdate('paused', remoteJid);
    } catch (e) {
      // Non-fatal
    }

    // 8. Send reply via WhatsApp
    await sock.sendMessage(
      remoteJid,
      { text: replyText },
      { quoted: msg }
    );

    console.log(`[WhatsApp Outbound] Replied to ${senderName}: "${replyText}"`);
    addActivityLog({
      type: 'outbound',
      sender: config.agentName,
      jid: remoteJid,
      text: replyText,
    });

    // 9. Update conversation memory
    appendChatMessage(remoteJid, 'user', cleanText);
    appendChatMessage(remoteJid, 'assistant', replyText);

  } catch (error) {
    console.error('[Handler Error]', error.message);
    addActivityLog({
      type: 'error',
      sender: 'System',
      jid: msg.key?.remoteJid || 'unknown',
      text: `Error processing message: ${error.message}`,
    });
  }
}
