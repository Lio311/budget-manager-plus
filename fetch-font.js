const fs = require('fs');
const https = require('https');
const path = require('path');

const fontUrl = 'https://fonts.gstatic.com/s/alef/v12/6xKxdS9_T593H7S8.ttf';
const outputPath = path.join(__dirname, 'src', 'lib', 'pdf', 'font-data.ts');

console.log('Fetching font from:', fontUrl);

https.get(fontUrl, (res) => {
    if (res.statusCode !== 200) {
        console.error('Failed to fetch font, status code:', res.statusCode);
        process.exit(1);
    }
    const data = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        const base64 = buffer.toString('base64');
        const content = `export const ALEF_FONT_BASE64 = "${base64}";`;
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, content);
        console.log('Font data written to ' + outputPath);
    });
}).on('error', (err) => {
    console.error('Error fetching font:', err);
    process.exit(1);
});
