# geo_my_ai_agent_brother

> 🤖 **Geo** — Your Autonomous Personal AI Brother & WhatsApp Auto-Reply Agent. Powered by **Nous Hermes 3** & 100% Free-Tier Cloud Architecture.

---

## 🌟 Overview

**Geo** is a smart, loyal, caring, and witty AI brother designed to automatically reply to incoming WhatsApp messages from your personal phone. 

- 💬 **Speaks Your Language**: Understands and replies seamlessly in **Bangla (বাংলা)**, **Banglish** ("ki khobor bro"), and **English**.
- 🧠 **Hermes Brain**: Default powered by **Nous Hermes 3** on OpenRouter (100% Free), with instant fallbacks to **Google Gemini Flash** or **Groq Llama 3**.
- 📱 **Zero-Cost WhatsApp Connection**: Connects to your existing personal WhatsApp via QR code or 8-digit phone pairing code (powered by Baileys). No paid Meta Cloud API or Twilio account required!
- ☁️ **Deploy Free on Render**: 100% free web service deployment with auto-deploy on git push.
- 🔄 **Persistent Cloud Session**: Supports free **MongoDB Atlas (M0)** so your WhatsApp login is never lost when Render restarts!
- ⚡ **24/7 Keep-Alive**: Built-in pinging and `/health` monitor to keep the Render free tier running around the clock without sleeping.
- 🎨 **Modern Web Dashboard**: Live glassmorphic web UI to view QR codes, generate pairing codes, check uptime, and test-chat with Geo directly in your browser.

---

## 🚀 100% Free Architecture

| Component | Service | Cost |
| :--- | :--- | :--- |
| **Hosting & Web Dashboard** | [Render](https://render.com) (Free Web Service) | **$0 / month** |
| **Source Code Repository** | [GitHub](https://github.com/Galib-Mahmud/geo_my_ai_agent_brother) | **$0 / month** |
| **AI LLM Model** | [OpenRouter](https://openrouter.ai) (Nous Hermes 3 / Free models) or [Google Gemini](https://aistudio.google.com) | **$0 / month** |
| **WhatsApp Multi-Device Engine** | `@whiskeysockets/baileys` (Socket protocol) | **$0 / month** |
| **Session Persistence** | [MongoDB Atlas](https://www.mongodb.com/atlas) (Free M0 Cluster) | **$0 / month** |
| **24/7 Uptime Keep-Alive** | [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) | **$0 / month** |

---

## 🛠️ Step-by-Step Setup & Deployment

### Step 1: Get Your Free AI Key (Choose any 1 or all)

1. **OpenRouter (Recommended for Hermes)**:
   - Go to [openrouter.ai](https://openrouter.ai) and sign up with Google/GitHub.
   - Go to **Keys** > **Create Key**. Copy your `sk-or-...` key.
   - (Default model is `nousresearch/hermes-3-llama-3.1-405b:free` or `openrouter/free`).

2. **Google Gemini (Optional Fallback)**:
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click **Get API key** > Create key in a new project.

---

### Step 2: Get Free Persistent WhatsApp Storage (Optional but Recommended)

By default, Render's free tier has an ephemeral disk (files reset on restart). To prevent having to re-scan the QR code when Render sleeps or redeploys:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** database cluster (100% free forever).
3. Under **Database Access**, create a user & password.
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere).
5. Click **Connect** > **Drivers** > Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

### Step 3: Deploy to Render for Free

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `Galib-Mahmud/geo_my_ai_agent_brother`.
4. Configure the service settings:
   - **Name**: `geo-ai-agent-brother`
   - **Region**: Singapore or Oregon (any)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. In **Environment Variables**, add:
   - `OPENROUTER_API_KEY`: *(Your OpenRouter API Key)*
   - `OPENROUTER_MODEL`: `nousresearch/hermes-3-llama-3.1-405b:free`
   - `MONGODB_URI`: *(Your MongoDB connection string from Step 2, if created)*
   - `RENDER_EXTERNAL_URL`: `https://your-service-name.onrender.com`
   - `OWNER_NAME`: `Galib Mahmud`
   - `AGENT_NAME`: `Geo`
   - `REPLY_TO_GROUPS`: `false`
   - `REPLY_TO_SELF`: `false`
6. Click **Deploy Web Service**.

---

### Step 4: Link WhatsApp to Geo

Once Render finishes deploying:
1. Open your public Render URL (e.g. `https://geo-ai-agent-brother.onrender.com`).
2. You have two easy ways to link:
   - **Option A (QR Code)**:
     - Open **WhatsApp** on your phone.
     - Go to **Linked Devices** > **Link a Device**.
     - Scan the QR code displayed on the web dashboard.
   - **Option B (Phone Pairing Code)**:
     - Switch to the **Phone Pairing Code** tab on the web dashboard.
     - Type your WhatsApp number (e.g. `88017XXXXXXXX`) and click **Get Code**.
     - An 8-digit code will appear (e.g. `ABCD-1234`).
     - On WhatsApp, tap **Linked Devices** > **Link a Device** > **Link with phone number instead** and enter the code.
3. Once connected, the dashboard turns green: **Online & Active**!

---

### Step 5: Keep Render Awake 24/7 (100% Free)

Render's free tier sleeps after 15 minutes of inactivity. To keep Geo running 24/7:
1. Create a free account at [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**.
3. **Title**: `Geo WhatsApp Keep-Alive`
4. **URL**: `https://your-service-name.onrender.com/health`
5. **Execution Schedule**: Every **10 minutes**.
6. Save! Now Render will never sleep, and Geo will stay online 24/7.

---

## 💻 Local Development

To run Geo on your local computer:

```bash
# Clone the repository
git clone git@github.com:Galib-Mahmud/geo_my_ai_agent_brother.git
cd geo_my_ai_agent_brother

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and paste your OPENROUTER_API_KEY

# Start the agent
npm start
```

Visit `http://localhost:3000` in your browser to view the dashboard and scan the QR code!

---

## ⚙️ Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for Express web server |
| `AGENT_NAME` | `Geo` | Persona name of the AI agent |
| `OWNER_NAME` | `Galib Mahmud` | Name of the owner Geo serves |
| `LLM_PROVIDER` | `openrouter` | AI engine (`openrouter`, `gemini`, `groq`) |
| `OPENROUTER_API_KEY` | - | OpenRouter API Key |
| `OPENROUTER_MODEL` | `nousresearch/hermes-3-llama-3.1-405b:free` | Free Hermes model ID |
| `GEMINI_API_KEY` | - | Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model name |
| `GROQ_API_KEY` | - | Groq API Key |
| `MONGODB_URI` | - | MongoDB Atlas connection string for persistent session |
| `RENDER_EXTERNAL_URL` | - | Public URL of deployed service on Render |
| `REPLY_TO_GROUPS` | `false` | Whether Geo should reply to WhatsApp groups |
| `REPLY_TO_SELF` | `false` | Whether Geo should reply when messaging your own number |
| `TYPING_DELAY_MS` | `2000` | Delay in ms to simulate human typing before sending reply |

---

## 🔒 Privacy & Safety

- WhatsApp credentials (`auth_info_baileys/` and `.env`) are ignored by `.gitignore` and **never** pushed to GitHub.
- Geo automatically filters out WhatsApp status broadcasts and ignores group messages by default to prevent spam.
- Geo uses simulated typing status (`composing`) to look completely natural.

---

## 👨‍💻 Author

Crafted with ❤️ by **[Galib Mahmud](https://github.com/Galib-Mahmud)**.
Licensed under the [MIT License](LICENSE).
