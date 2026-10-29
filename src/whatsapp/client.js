import makeWASocket, { DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { getAuthState } from './authStore.js';
import { handleIncomingMessage, addActivityLog } from '../agent/handler.js';
import { config } from '../config.js';

let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let pairingCode = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let userInfo = null;
let startedAt = null;

export function getClientStatus() {
  return {
    status: connectionStatus,
    qrDataUrl: currentQrDataUrl,
    pairingCode: pairingCode,
    user: userInfo,
    startedAt: startedAt,
    uptimeSeconds: startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0,
    agentName: config.agentName,
    ownerName: config.ownerName,
    llmProvider: config.llmProvider,
    model: config[config.llmProvider]?.model || 'default',
    hasApiKey: Boolean(config.openrouter?.apiKey && config.openrouter.apiKey.length > 20),
  };
}

export async function requestWhatsAppPairingCode(phoneNumber) {
  if (!sock) {
    throw new Error('WhatsApp client is not initialized yet');
  }
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber || cleanNumber.length < 10) {
    throw new Error('Please enter a valid phone number with country code (e.g. 88017XXXXXXXX)');
  }

  try {
    const code = await sock.requestPairingCode(cleanNumber);
    pairingCode = code;
    connectionStatus = 'qr_ready';
    console.log(`📱 WhatsApp Pairing Code generated: ${code}`);
    return code;
  } catch (err) {
    console.error('Failed to request pairing code:', err.message);
    throw err;
  }
}

export async function initWhatsApp() {
  connectionStatus = 'connecting';
  console.log('🔄 Initializing WhatsApp connection for Geo...');

  const { state, saveCreds } = await getAuthState();

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connectionStatus = 'qr_ready';
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        });
        console.log('📸 QR Code generated! Scan via WhatsApp or visit web dashboard.');
      } catch (err) {
        console.error('QR generation error:', err.message);
      }
    }

    if (connection === 'close') {
      connectionStatus = 'disconnected';
      currentQrDataUrl = null;
      pairingCode = null;

      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : lastDisconnect?.error?.statusCode;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Connection closed. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      addActivityLog({
        type: 'status',
        sender: 'System',
        jid: 'whatsapp',
        text: `Connection closed (${statusCode || 'unknown'}). ${shouldReconnect ? 'Reconnecting in 5s...' : 'Logged out. Please scan QR again.'}`,
      });

      if (shouldReconnect) {
        setTimeout(() => {
          initWhatsApp().catch(console.error);
        }, 5000);
      } else {
        console.log('🔒 Logged out of WhatsApp. Clear auth store and re-scan QR.');
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      currentQr = null;
      currentQrDataUrl = null;
      pairingCode = null;
      startedAt = Date.now();

      const user = sock.user;
      userInfo = {
        id: user?.id,
        name: user?.name || config.ownerName,
        phone: user?.id?.split(':')[0] || 'Linked',
      };

      console.log(`✅ ${config.agentName} is ONLINE on WhatsApp! Logged in as: ${userInfo.name} (${userInfo.phone})`);
      addActivityLog({
        type: 'status',
        sender: 'System',
        jid: 'whatsapp',
        text: `Geo is now online and actively protecting your WhatsApp!`,
      });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      await handleIncomingMessage(sock, msg);
    }
  });

  return sock;
}

export function getSocket() {
  return sock;
}
