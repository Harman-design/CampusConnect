require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  console.log(`Key prefix verified: "${apiKey.substring(0, 8)}..."`);
  console.log(`Key Length: ${apiKey.length}`);

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent('Say hello back in 3 words.');
    const response = await result.response;
    console.log(`Response: "${response.text().trim()}"`);
    console.log('✔ Gemini API key check completed successfully!');
  } catch (err) {
    console.error('Gemini API call failed:', err.message);
  }
}

run();
