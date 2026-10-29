import axios from 'axios';
import { config } from '../config.js';

export function startKeepAlive() {
  const url = config.renderExternalUrl;
  if (!url) {
    console.log('ℹ️ RENDER_EXTERNAL_URL is not set. To keep Render 24/7 active for free, add your Render app URL to .env or use cron-job.org');
    return;
  }

  const cleanUrl = url.replace(/\/+$/, '') + '/health';
  console.log(`⏱️ Auto Keep-Alive activated! Pinging ${cleanUrl} every 10 minutes.`);

  // Initial ping after 1 minute
  setTimeout(() => {
    pingService(cleanUrl);
  }, 60000);

  // Periodic ping every 10 minutes (Render sleeps after 15m)
  setInterval(() => {
    pingService(cleanUrl);
  }, 10 * 60 * 1000);
}

async function pingService(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    console.log(`[Keep-Alive] Pinged ${url} - Status: ${res.status}`);
  } catch (err) {
    console.warn(`[Keep-Alive] Ping failed: ${err.message}`);
  }
}
