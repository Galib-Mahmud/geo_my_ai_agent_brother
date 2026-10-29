// Geo WhatsApp AI Agent Dashboard Script

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const valBrain = document.getElementById('valBrain');
const valModel = document.getElementById('valModel');
const valPhone = document.getElementById('valPhone');
const valUser = document.getElementById('valUser');
const valUptime = document.getElementById('valUptime');

const qrSpinner = document.getElementById('qrSpinner');
const qrImage = document.getElementById('qrImage');
const qrInstructions = document.getElementById('qrInstructions');
const connectedState = document.getElementById('connectedState');
const connectedNumber = document.getElementById('connectedNumber');

const btnReconnect = document.getElementById('btnReconnect');
const btnClearLogs = document.getElementById('btnClearLogs');
const logStream = document.getElementById('logStream');

// Tab Switcher
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const targetPane = document.getElementById(btn.getAttribute('data-tab'));
    if (targetPane) targetPane.classList.add('active');
  });
});

// Pairing Code
const inputPhone = document.getElementById('inputPhone');
const btnGetPairingCode = document.getElementById('btnGetPairingCode');
const pairingResult = document.getElementById('pairingResult');
const displayPairingCode = document.getElementById('displayPairingCode');

btnGetPairingCode?.addEventListener('click', async () => {
  const phone = inputPhone.value.trim();
  if (!phone) {
    alert('Please enter your WhatsApp phone number with country code (e.g. 88017XXXXXXXX)');
    return;
  }

  btnGetPairingCode.disabled = true;
  btnGetPairingCode.innerText = 'Requesting...';

  try {
    const res = await fetch('/api/pairing-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone }),
    });

    const data = await res.json();
    if (data.code) {
      pairingResult.classList.remove('hidden');
      // Format 8-digit code nicely (e.g. 1234-5678)
      const raw = data.code.toString();
      displayPairingCode.innerText = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
    } else {
      alert(data.error || 'Failed to generate pairing code');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btnGetPairingCode.disabled = false;
    btnGetPairingCode.innerText = 'Get Code';
  }
});

// Update API Key Dynamically
const inputApiKey = document.getElementById('inputApiKey');
const btnSaveKey = document.getElementById('btnSaveKey');

btnSaveKey?.addEventListener('click', async () => {
  const key = inputApiKey.value.trim();
  if (!key) {
    alert('Please paste a valid OpenRouter API key');
    return;
  }
  btnSaveKey.disabled = true;
  btnSaveKey.innerText = 'Applying...';
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key, model: 'openrouter/free' }),
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Key applied successfully! Testing now...');
      inputApiKey.value = '';
      updateStatus();
    } else {
      alert('Error updating settings: ' + data.error);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btnSaveKey.disabled = false;
    btnSaveKey.innerText = 'Save & Apply';
  }
});

// Format seconds into HH:MM:SS
function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Fetch System Status
async function updateStatus() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status fetch failed');
    const data = await res.json();

    valBrain.innerText = `${data.llmProvider.toUpperCase()}`;
    valModel.innerText = data.model;
    valUptime.innerText = formatUptime(data.uptimeSeconds);

    if (data.status === 'connected') {
      statusDot.className = 'status-dot online';
      statusText.innerText = 'Online & Active';

      valPhone.innerText = '🟢 Connected';
      valUser.innerText = data.user?.name || `Owner: ${data.ownerName}`;

      qrSpinner.classList.add('hidden');
      qrImage.classList.add('hidden');
      qrInstructions.classList.add('hidden');
      connectedState.classList.remove('hidden');
      connectedNumber.innerText = data.user?.phone || 'Linked to Phone';
    } else if (data.status === 'qr_ready') {
      statusDot.className = 'status-dot pulse';
      statusText.innerText = 'Scan QR Code';

      valPhone.innerText = '🟡 Awaiting Scan';
      connectedState.classList.add('hidden');
      qrInstructions.classList.remove('hidden');

      if (data.qrDataUrl) {
        qrSpinner.classList.add('hidden');
        qrImage.src = data.qrDataUrl;
        qrImage.classList.remove('hidden');
      }
    } else {
      statusDot.className = 'status-dot offline';
      statusText.innerText = 'Disconnected';
      valPhone.innerText = '🔴 Offline';
      connectedState.classList.add('hidden');
      qrImage.classList.add('hidden');
      qrSpinner.classList.remove('hidden');
    }
  } catch (e) {
    statusDot.className = 'status-dot offline';
    statusText.innerText = 'Server Offline';
  }
}

// Fetch Activity Logs
async function updateLogs() {
  try {
    const res = await fetch('/api/logs');
    const data = await res.json();
    if (!data.logs || data.logs.length === 0) return;

    logStream.innerHTML = data.logs.map(log => {
      let badgeClass = 'badge-sys';
      let badgeText = 'SYS';
      if (log.type === 'inbound') {
        badgeClass = 'badge-in';
        badgeText = 'IN';
      } else if (log.type === 'outbound') {
        badgeClass = 'badge-out';
        badgeText = 'REPLY';
      }

      return `
        <div class="log-item">
          <span class="log-time">[${log.timestamp}]</span>
          <span class="log-badge ${badgeClass}">${badgeText}</span>
          <span class="log-content"><strong>${escapeHtml(log.sender)}:</strong> ${escapeHtml(log.text)}</span>
        </div>
      `;
    }).join('');
  } catch (e) {
    // Non-fatal
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// Interactive Test Chat
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  // Add User bubble
  appendChatBubble('You', text, 'bubble-user');
  chatInput.value = '';

  // Add temporary typing bubble
  const typingId = 'typing-' + Date.now();
  appendChatBubble('Geo', 'Thinking...', 'bubble-agent', typingId);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();
    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();

    if (data.reply) {
      appendChatBubble('Geo', data.reply, 'bubble-agent');
    } else {
      appendChatBubble('Geo', data.error || 'Failed to get reply', 'bubble-agent');
    }
  } catch (err) {
    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();
    appendChatBubble('Geo', 'Error: ' + err.message, 'bubble-agent');
  }
});

function appendChatBubble(sender, message, bubbleClass, id = null) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${bubbleClass}`;
  if (id) bubble.id = id;

  bubble.innerHTML = `
    <div class="bubble-header">
      <span class="agent-name">${escapeHtml(sender)}</span>
      <span class="bubble-time">Now</span>
    </div>
    <div class="bubble-body">${escapeHtml(message)}</div>
  `;

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Reconnect button
btnReconnect?.addEventListener('click', async () => {
  btnReconnect.disabled = true;
  btnReconnect.innerText = 'Reconnecting...';
  try {
    await fetch('/api/reconnect', { method: 'POST' });
    setTimeout(updateStatus, 1500);
  } catch (e) {
    alert('Failed to trigger reconnect');
  } finally {
    setTimeout(() => {
      btnReconnect.disabled = false;
      btnReconnect.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        Reconnect
      `;
    }, 2000);
  }
});

btnClearLogs?.addEventListener('click', () => {
  logStream.innerHTML = '<div class="log-empty">Logs cleared.</div>';
});

// Periodic polling
updateStatus();
updateLogs();
setInterval(updateStatus, 3000);
setInterval(updateLogs, 5000);
