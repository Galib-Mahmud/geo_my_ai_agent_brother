import { config } from './config.js';
import { createServer } from './server/app.js';
import { initWhatsApp } from './whatsapp/client.js';
import { startKeepAlive } from './server/keepAlive.js';

async function bootstrap() {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║       🤖 ${config.agentName} - The AI Brother & WhatsApp Agent       ║
  ║          Autonomous Personal Assistant & Companion     ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);

  const app = createServer();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 Dashboard running at: http://localhost:${config.port}`);
    console.log(`🤖 Active LLM Provider: ${config.llmProvider.toUpperCase()}`);
    console.log(`👤 Owner: ${config.ownerName}`);
  });

  // Start self-pinging keep alive for Render
  startKeepAlive();

  // Initialize WhatsApp connection
  try {
    await initWhatsApp();
  } catch (err) {
    console.error('Failed to start WhatsApp client on launch:', err.message);
  }
}

bootstrap().catch((err) => {
  console.error('Fatal crash on startup:', err);
  process.exit(1);
});
