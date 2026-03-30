require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const SYSTEM_PROMPT = require('./prompt');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-contact conversation history: Map<contactId, Array<{role, content}>>
const conversations = new Map();
const MAX_HISTORY = 20;

async function respond(contactId, userText) {
  if (!conversations.has(contactId)) {
    conversations.set(contactId, []);
  }

  const history = conversations.get(contactId);
  history.push({ role: 'user', content: userText });

  // Keep last MAX_HISTORY messages to stay within token limits
  const trimmed = history.slice(-MAX_HISTORY);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: trimmed,
  });

  const reply = response.content[0].text;

  // Persist assistant turn
  history.push({ role: 'assistant', content: reply });

  // Trim stored history too
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  return reply;
}

function clearHistory(contactId) {
  conversations.delete(contactId);
}

module.exports = { respond, clearHistory };
