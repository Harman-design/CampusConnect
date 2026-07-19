require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  console.log(`Key Prefix: "${apiKey.substring(0, 8)}..."`);

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    // GoogleGenerativeAI lists models through a specific request format, but we can query it or list it.
    // Let's call the listModels endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const json = await response.json();
    if (json.models) {
      console.log('Available Models:');
      json.models.forEach(m => console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`));
    } else {
      console.log('Error listing models:', json);
    }
  } catch (err) {
    console.error('Failed to list models:', err.message);
  }
}

run();
