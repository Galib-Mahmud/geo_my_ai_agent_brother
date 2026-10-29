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

// Helper to extract text from any WhatsApp message wrapper (ephemeral, view-once, media caption, etc.)
export function extractMessageText(message) {
  if (!message) return '';

  let content = message;
  // Unwrap nested message wrappers
  if (content.ephemeralMessage?.message) content = content.ephemeralMessage.message;
  if (content.viewOnceMessage?.message) content = content.viewOnceMessage.message;
  if (content.viewOnceMessageV2?.message) content = content.viewOnceMessageV2.message;
  if (content.documentWithCaptionMessage?.message) content = content.documentWithCaptionMessage.message;

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    ''
  ).trim();
}

export async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg || !msg.message) return;

    const key = msg.key;
    const fromMe = Boolean(key.fromMe);
    const remoteJid = key.remoteJid;

    if (!remoteJid) return;

    // 1. Filter out WhatsApp status stories
    if (remoteJid === 'status@broadcast' || remoteJid.includes('broadcast')) {
      return;
    }

    // 2. Filter out group messages if disabled
    const isGroup = remoteJid.endsWith('@g.us');
    if (isGroup && !config.replyToGroups) {
      return;
    }

    // 3. Self-message detection & testing support
    // If the message is fromMe:
    // Only process if it's sent to self (Notes to self / self chat) OR if replyToSelf is explicitly enabled.
    // If it's sent fromMe to someone else, ignore so we don't reply to our own outgoing messages to other people.
    const myPhone = sock.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '') || '';
    const cleanRemote = remoteJid.replace(/[^0-9]/g, '');
    const isSelfChat = myPhone && cleanRemote && (cleanRemote.startsWith(myPhone) || myPhone.startsWith(cleanRemote));

    if (fromMe && !isSelfChat && !config.replyToSelf) {
      return;
    }

    // 4. Extract incoming text content
    const text = extractMessageText(msg.message);
    if (!text) {
      console.log(`[WhatsApp Inbound] Received non-text or unsupported message type from ${remoteJid}`);
      return;
    }

    const senderName = msg.pushName || (isSelfChat ? config.ownerName : 'Friend');
    console.log(`\n📩 [WhatsApp Inbound] From: "${senderName}" (${remoteJid}) | Message: "${text}"`);

    addActivityLog({
      type: 'inbound',
      sender: senderName,
      jid: remoteJid,
      text: text,
    });

    // 5. Send typing indicator ("typing...")
    try {
      await sock.sendPresenceUpdate('composing', remoteJid);
    } catch (e) {
      // Non-fatal
    }

    // 6. Build prompt & conversation history
    const history = getChatHistory(remoteJid);
    const messages = [
      { role: 'system', content: getSystemPrompt(senderName) },
      ...history,
      { role: 'user', content: text },
    ];

    // Optional delay to simulate natural human typing
    if (config.typingDelayMs > 0) {
      await new Promise(r => setTimeout(r, Math.min(config.typingDelayMs, 3000)));
    }

    // 7. Generate response from AI Brain
    console.log(`🤖 [AI Generation] Thinking response for "${senderName}"...`);
    const replyText = await generateAIReply(messages);

    // Stop typing indicator
    try {
      await sock.sendPresenceUpdate('paused', remoteJid);
    } catch (e) {
      // Non-fatal
    }

    // 8. Send reply via WhatsApp (with fallback if quoted message fails)
    try {
      await sock.sendMessage(
        remoteJid,
        { text: replyText },
        { quoted: msg }
      );
    } catch (quotedErr) {
      console.warn(`[WhatsApp Send] Quoted message failed (${quotedErr.message}). Sending plain text...`);
      await sock.sendMessage(remoteJid, { text: replyText });
    }

    console.log(`📤 [WhatsApp Outbound] Replied to "${senderName}": "${replyText}"\n`);
    addActivityLog({
      type: 'outbound',
      sender: config.agentName,
      jid: remoteJid,
      text: replyText,
    });

    // 9. Update conversation memory
    appendChatMessage(remoteJid, 'user', text);
    appendChatMessage(remoteJid, 'assistant', replyText);

  } catch (error) {
    console.error('❌ [Handler Error]', error);
    addActivityLog({
      type: 'error',
      sender: 'System',
      jid: msg.key?.remoteJid || 'unknown',
      text: `Error processing message: ${error.message}`,
    });
  }
}
