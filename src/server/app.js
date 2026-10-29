import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { getClientStatus, requestWhatsAppPairingCode, initWhatsApp } from '../whatsapp/client.js';
import { recentActivities, addActivityLog } from '../agent/handler.js';
import { generateAIReply } from '../llm/index.js';
import { getSystemPrompt } from '../agent/persona.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../public')));

  // Health check endpoint for Render & Uptime monitors
  app.get(['/health', '/ping'], (req, res) => {
    const status = getClientStatus();
    res.status(200).json({
      status: 'ok',
      agent: config.agentName,
      whatsapp: status.status,
      uptimeSeconds: status.uptimeSeconds,
      timestamp: new Date().toISOString(),
    });
  });

  // Client status endpoint
  app.get('/api/status', (req, res) => {
    res.json(getClientStatus());
  });

  // Request WhatsApp Pairing Code by phone number
  app.post('/api/pairing-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
      const code = await requestWhatsAppPairingCode(phoneNumber);
      res.json({ success: true, code });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to generate pairing code' });
    }
  });

  // Restart WhatsApp connection manually
  app.post('/api/reconnect', async (req, res) => {
    try {
      await initWhatsApp();
      res.json({ success: true, message: 'Reconnecting WhatsApp...' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamically update API Key and test connection
  app.post('/api/settings', async (req, res) => {
    const { apiKey, model } = req.body;
    if (apiKey) {
      const clean = apiKey.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
      config.openrouter.apiKey = clean;
    }
    if (model) {
      config.openrouter.model = model.trim();
    }

    // Persist to local disk so restarts retain the key
    try {
      import('fs').then(fs => {
        fs.writeFileSync(
          path.join(process.cwd(), 'settings.json'),
          JSON.stringify({
            openrouterApiKey: config.openrouter.apiKey,
            openrouterModel: config.openrouter.model,
          }, null, 2)
        );
      });
    } catch (e) {
      // ignore
    }

    res.json({
      success: true,
      message: 'Settings updated successfully!',
      model: config.openrouter.model,
      hasKey: Boolean(config.openrouter.apiKey),
    });
  });

  // Recent activity logs
  app.get('/api/logs', (req, res) => {
    res.json({ logs: recentActivities });
  });

  // Test chat with Geo directly from browser dashboard
  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    try {
      const messages = [
        { role: 'system', content: getSystemPrompt('Web Guest') },
        { role: 'user', content: message.trim() },
      ];

      const reply = await generateAIReply(messages);
      addActivityLog({
        type: 'web_chat',
        sender: 'Web User',
        jid: 'web-dashboard',
        text: message.trim(),
      });
      addActivityLog({
        type: 'web_reply',
        sender: config.agentName,
        jid: 'web-dashboard',
        text: reply,
      });

      res.json({ reply });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
