/**
 * Riley Widget Server v2
 * Serves the voice + chat widget and proxies Retell API calls
 * 
 * Author: AI Alive, Inc.
 * Version: 2.0.0
 */

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const PORT = process.env.PORT || 3000;
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const VOICE_AGENT_ID = process.env.RETELL_VOICE_AGENT_ID;
const CHAT_AGENT_ID = process.env.RETELL_CHAT_AGENT_ID;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'riley-widget-v2',
    voice_agent: VOICE_AGENT_ID ? 'configured' : 'missing',
    chat_agent: CHAT_AGENT_ID ? 'configured' : 'missing'
  });
});

// =============================================================================
// VOICE ENDPOINTS
// =============================================================================

/**
 * POST /api/create-call
 * Create a web call for voice mode
 */
app.post('/api/create-call', async (req, res) => {
  console.log('📞 Creating voice call...');
  
  try {
    const agentId = req.body.agent_id || VOICE_AGENT_ID;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Voice agent not configured' });
    }
    
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Retell create-web-call error:', error);
      return res.status(response.status).json({ error: 'Failed to create call' });
    }
    
    const data = await response.json();
    console.log('✅ Voice call created:', data.call_id);
    
    res.json({
      access_token: data.access_token,
      call_id: data.call_id
    });
    
  } catch (error) {
    console.error('❌ create-call error:', error.message);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// =============================================================================
// CHAT ENDPOINTS
// =============================================================================

/**
 * POST /chat/start
 * Start a new chat session
 */
app.post('/chat/start', async (req, res) => {
  console.log('💬 Starting chat session...');
  
  try {
    const agentId = req.body.agent_id || CHAT_AGENT_ID;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Chat agent not configured' });
    }
    
    const response = await fetch('https://api.retellai.com/v2/create-chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Retell create-chat error:', error);
      return res.status(response.status).json({ error: 'Failed to start chat' });
    }
    
    const data = await response.json();
    console.log('✅ Chat session started:', data.chat_id);
    
    res.json({
      chat_id: data.chat_id,
      agent_id: data.agent_id,
      status: 'started'
    });
    
  } catch (error) {
    console.error('❌ chat/start error:', error.message);
    res.status(500).json({ error: 'Failed to start chat session' });
  }
});

/**
 * POST /chat/message
 * Send a message and get agent response
 */
app.post('/chat/message', async (req, res) => {
  console.log('💬 Sending chat message...');
  
  try {
    const { chat_id, content } = req.body;
    
    if (!chat_id || !content) {
      return res.status(400).json({ error: 'chat_id and content are required' });
    }
    
    const response = await fetch('https://api.retellai.com/v2/create-chat-completion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chat_id,
        content: content
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Retell chat-completion error:', error);
      return res.status(response.status).json({ error: 'Failed to get response' });
    }
    
    const data = await response.json();
    console.log('✅ Chat response received');
    
    res.json({
      messages: data.messages || [],
      chat_id: chat_id
    });
    
  } catch (error) {
    console.error('❌ chat/message error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /chat/end
 * End a chat session
 */
app.post('/chat/end', async (req, res) => {
  console.log('💬 Ending chat session...');
  
  try {
    const { chat_id } = req.body;
    
    if (!chat_id) {
      return res.status(400).json({ error: 'chat_id is required' });
    }
    
    const response = await fetch(`https://api.retellai.com/v2/end-chat/${chat_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Don't fail if chat already ended
    console.log('✅ Chat session ended:', chat_id);
    res.json({ status: 'ended', chat_id });
    
  } catch (error) {
    console.error('❌ chat/end error:', error.message);
    res.json({ status: 'ended', chat_id: req.body.chat_id });
  }
});

// =============================================================================
// CONFIG ENDPOINT (for widget to get settings)
// =============================================================================

/**
 * GET /api/config
 * Returns public configuration for the widget
 */
app.get('/api/config', (req, res) => {
  res.json({
    voice_enabled: !!VOICE_AGENT_ID,
    chat_enabled: !!CHAT_AGENT_ID,
    phone_number: process.env.PHONE_NUMBER || '1 (310) 919-0276'
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Riley Widget v2.0.0                                 ║
║           AI Alive, Inc.                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                                  ║
║                                                              ║
║  Voice Agent: ${VOICE_AGENT_ID ? '✅ ' + VOICE_AGENT_ID.substring(0, 20) + '...' : '❌ Not configured'}
║  Chat Agent:  ${CHAT_AGENT_ID ? '✅ ' + CHAT_AGENT_ID.substring(0, 20) + '...' : '⏳ Pending (convert voice agent first)'}
║                                                              ║
║  Endpoints:                                                  ║
║    GET  /health         - Health check                       ║
║    GET  /api/config     - Widget configuration               ║
║    POST /api/create-call - Create voice call                 ║
║    POST /chat/start     - Start chat session                 ║
║    POST /chat/message   - Send chat message                  ║
║    POST /chat/end       - End chat session                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
