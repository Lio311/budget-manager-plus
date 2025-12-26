const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyDO9OvmDhgzqyPB1WrlHhkobretmtVQ3E0';

async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API...\n');

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        console.log('✅ API Key initialized');

        // Test with gemini-1.5-flash
        console.log('\n📡 Testing model: gemini-1.5-flash');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Model loaded');

        const prompt = `אתה יועץ פיננסי. ספק ניתוח קצר (2-3 משפטים) למשתמש עם:
- הכנסות: 10,000 ₪
- הוצאות: 7,000 ₪
- חיסכון: 3,000 ₪ (30%)`;

        console.log('\n📤 Sending test prompt...');
        console.log('Prompt:', prompt);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log('\n✅ SUCCESS! Received response:');
        console.log('─'.repeat(60));
        console.log(text);
        console.log('─'.repeat(60));
        console.log(`\n📊 Response length: ${text.length} characters`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
    }
}

testGeminiAPI();
