require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const SYSTEM_PROMPT = require('./src/prompt');

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-session conversation memory
const sessions = new Map();
const MAX_HISTORY = 20;

app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/chat-ui', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'Missing sessionId or message' });
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }

  const history = sessions.get(sessionId);

  if (message.trim().toLowerCase() === '/reset') {
    sessions.delete(sessionId);
    return res.json({ reply: 'Conversation reset. Ready for a new creator analysis.' });
  }

  history.push({ role: 'user', content: message });

  const trimmed = history.slice(-MAX_HISTORY);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    res.json({ reply });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Agent error. Check your ANTHROPIC_API_KEY in .env' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅ NutriUniverse Agent is running!`);
    console.log(`👉 Open this link in your browser: http://localhost:${PORT}\n`);
  });
}

module.exports = app;
