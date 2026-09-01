/**
 * RealWealth Riley Widget Server v2.0
 * Voice + Chat support
 */

const express = require("express");
const cors = require("cors");
const Retell = require("retell-sdk").default;
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuration
const PORT = process.env.PORT || 8080;
const VOICE_AGENT_ID = process.env.RETELL_VOICE_AGENT_ID || process.env.AGENT_ID;
const CHAT_AGENT_ID = process.env.RETELL_CHAT_AGENT_ID;

// Initialize Retell client
const client = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    voice: !!VOICE_AGENT_ID,
    chat: !!CHAT_AGENT_ID
  });
});

// Config endpoint for frontend
app.get("/api/config", (req, res) => {
  res.json({
    voice_enabled: !!VOICE_AGENT_ID,
    chat_enabled: !!CHAT_AGENT_ID,
    phone_number: process.env.PHONE_NUMBER || "1 (310) 919-0276"
  });
});

// Create voice call
app.post("/create-web-call", async (req, res) => {
  try {
    const agentId = req.body.agent_id || VOICE_AGENT_ID;
    
    if (!agentId) {
      return res.status(400).json({ error: "Voice agent not configured" });
    }

    const webCallResponse = await client.call.createWebCall({
      agent_id: agentId,
    });

    res.json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });
  } catch (error) {
    console.error("Error creating web call:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start chat session
app.post("/chat/start", async (req, res) => {
  try {
    const agentId = req.body.agent_id || CHAT_AGENT_ID;
    
    if (!agentId) {
      return res.status(400).json({ error: "Chat agent not configured" });
    }

    const chatResponse = await client.chat.create({
      agent_id: agentId,
    });

    res.json({
      chat_id: chatResponse.chat_id,
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send chat message
app.post("/chat/message", async (req, res) => {
  try {
    const { chat_id, content } = req.body;
    
    if (!chat_id || !content) {
      return res.status(400).json({ error: "chat_id and content required" });
    }

    const response = await client.chat.createChatCompletion({
      chat_id: chat_id,
      content: content,
    });

    res.json(response);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

// End chat session
app.post("/chat/end", async (req, res) => {
  try {
    const { chat_id } = req.body;
    
    if (!chat_id) {
      return res.status(400).json({ error: "chat_id required" });
    }

    await client.chat.end(chat_id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error ending chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          RealWealth Riley Widget v2.0                     ║
║          Powered by AI Alive                              ║
╠═══════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                             ║
║  Voice:  ${VOICE_AGENT_ID ? '✅ Configured' : '❌ Missing RETELL_VOICE_AGENT_ID'}                       
║  Chat:   ${CHAT_AGENT_ID ? '✅ Configured' : '❌ Missing RETELL_CHAT_AGENT_ID'}                        
╚═══════════════════════════════════════════════════════════╝
  `);
});
