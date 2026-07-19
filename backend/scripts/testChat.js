require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const geminiService = require('../services/geminiService');

async function run() {
  try {
    const SYSTEM_PERSONA =
      'You are CampusConnect AI, a helpful study assistant for engineering students at SRM Ramapuram College.';
    
    console.log('Sending message to Gemini Chat...');
    const reply = await geminiService.chat([], 'Explain the difference between SQL and NoSQL databases in one short sentence.', SYSTEM_PERSONA);
    console.log(`Reply: "${reply}"`);
    if (!reply.includes('Mock AI Assistant Mode')) {
      console.log('✔ Live Chat connection confirmed!');
    } else {
      console.log('⚠ Returned mock response.');
    }
  } catch (err) {
    console.error('Chat verification failed:', err.message);
  }
}

run();
