# Riley Widget — RealWealth Edition

Voice + Chat AI Widget for RealWealth, powered by Retell AI.

**Branding:** RealWealth colors (navy/teal), RealWealth logo

---

## Deploy to Railway

### Option A: From GitHub (Recommended)

1. Create a new GitHub repo: `riley-widget-realwealth`
2. Push these files to it
3. Go to [railway.app](https://railway.app)
4. New Project → Deploy from GitHub repo
5. Select the repo
6. Add environment variables (see below)
7. Deploy

### Option B: Direct Deploy

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Environment Variables

Set these in Railway:

```
RETELL_API_KEY=key_your_retell_api_key
RETELL_VOICE_AGENT_ID=agent_your_voice_agent_id
RETELL_CHAT_AGENT_ID=agent_your_chat_agent_id
PHONE_NUMBER=1 (310) 919-0276
```

---

## Get Agent IDs

**Voice Agent ID:**
1. Go to Retell Dashboard → Agents → Riley
2. Copy the Agent ID (starts with `agent_`)

**Chat Agent ID:**
1. In Retell Dashboard → Voice Agents → Riley
2. Click ··· menu → "Convert to Chat Agent"
3. Copy the new Chat Agent ID

---

## After Deployment

1. Get your Railway URL: `https://riley-widget-realwealth-production.up.railway.app`
2. Update WordPress plugin with this URL
3. Test voice and chat modes

---

## Customization

Colors are set in `public/index.html`:
- Primary teal: `#00b4b4`
- Dark navy: `#0f1f3d`
- Background: `#0a1628`

---

## Support

AI Alive, Inc.
https://aialive.app
