const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyDO9OvmDhgzqyPB1WrlHhkobretmtVQ3E0';

async function testGeminiPreview() {
    console.log('🧪 Testing Gemini 2.0 Flash Experimental...\n');

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        console.log('✅ API Key initialized');

        console.log('\n📡 Testing model: gemini-2.0-flash-exp');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        console.log('✅ Model loaded');

        const testPrompt = `אתה יועץ פיננסי מקצועי. ספק ניתוח קצר (3-4 משפטים) עבור:

**נתונים:**
- הכנסות: 15,000 ₪
- הוצאות: 12,000 ₪
- חיסכון: 3,000 ₪ (20%)

תן המלצה מקצועית בעברית.`;

        console.log('\n📤 Sending test prompt...');
        console.log('Prompt length:', testPrompt.length, 'characters');

        const startTime = Date.now();
        const result = await model.generateContent(testPrompt);
        const response = result.response;
        const text = response.text();
        const endTime = Date.now();

        console.log('\n✅ SUCCESS! Gemini 2.0 Flash Experimental is working!');
        console.log('═'.repeat(80));
        console.log('Response:');
        console.log(text);
        console.log('═'.repeat(80));
        console.log(`\n📊 Stats:`);
        console.log(`   Response length: ${text.length} characters`);
        console.log(`   Time taken: ${endTime - startTime}ms`);
        console.log('\n🎉 API is fully functional!\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:');
        console.error(error);
    }
}

testGeminiPreview();
