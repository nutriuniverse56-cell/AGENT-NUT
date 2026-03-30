require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const agent = require('./agent');

const puppeteerOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: puppeteerOptions,
});

client.on('qr', (qr) => {
  console.log('\n[NutriUniverse Bot] Scan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('[NutriUniverse Bot] Connected and ready.');
});

client.on('auth_failure', (msg) => {
  console.error('[NutriUniverse Bot] Auth failed:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('[NutriUniverse Bot] Disconnected:', reason);
});

client.on('message', async (msg) => {
  // Only handle direct messages (skip groups and broadcasts)
  if (msg.isGroupMsg || msg.from === 'status@broadcast') return;

  const contactId = msg.from;
  const userText = msg.body.trim();

  if (!userText) return;

  // Allow users to reset their conversation
  if (userText.toLowerCase() === '/reset') {
    agent.clearHistory(contactId);
    await msg.reply('Conversation reset. Send a creator to analyze or ask anything.');
    return;
  }

  console.log(`[${contactId}] → ${userText.slice(0, 80)}${userText.length > 80 ? '...' : ''}`);

  try {
    const reply = await agent.respond(contactId, userText);
    await msg.reply(reply);
    console.log(`[${contactId}] ← replied (${reply.length} chars)`);
  } catch (err) {
    console.error('[NutriUniverse Bot] Error:', err.message);
    await msg.reply('Something went wrong. Please try again in a moment.');
  }
});

client.initialize();
