const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyDO9OvmDhgzqyPB1WrlHhkobretmtVQ3E0';

async function testModels() {
    console.log('🧪 Testing Gemini Models...\n');

    const modelsToTest = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash-latest',
        'gemini-flash',
        'models/gemini-pro'
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);

    for (const modelName of modelsToTest) {
        console.log(`\n📡 Testing: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('תגיד שלום בעברית');
            const text = result.response.text();
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(`Response: ${text}`);
            console.log('─'.repeat(60));
            break; // Found working model, stop testing
        } catch (error) {
            console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);
        }
    }
}

testModels();
