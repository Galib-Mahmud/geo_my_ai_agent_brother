// Conversation memory buffer per sender JID

const conversationHistory = new Map();
const MAX_HISTORY = 10;
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getChatHistory(jid) {
  const record = conversationHistory.get(jid);
  if (!record) return [];

  // Check if expired
  if (Date.now() - record.lastUpdated > EXPIRY_MS) {
    conversationHistory.delete(jid);
    return [];
  }

  return record.messages;
}

export function appendChatMessage(jid, role, content) {
  let record = conversationHistory.get(jid);
  if (!record || Date.now() - record.lastUpdated > EXPIRY_MS) {
    record = { messages: [], lastUpdated: Date.now() };
    conversationHistory.set(jid, record);
  }

  record.messages.push({ role, content });
  record.lastUpdated = Date.now();

  // Keep only the most recent N turns
  if (record.messages.length > MAX_HISTORY) {
    record.messages = record.messages.slice(-MAX_HISTORY);
  }
}

export function clearChatHistory(jid) {
  conversationHistory.delete(jid);
}

export function getActiveConversationsCount() {
  return conversationHistory.size;
}
