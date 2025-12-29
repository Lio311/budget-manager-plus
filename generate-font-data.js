const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'public', 'fonts', 'Alef-Regular.ttf');
const outputPath = path.join(__dirname, 'src', 'lib', 'pdf', 'font-data.ts');

console.log('Reading font from:', fontPath);

try {
    if (!fs.existsSync(fontPath)) {
        console.error('Font file not found at:', fontPath);
        // Try finding any .ttf file in the directory
        const fontsDir = path.dirname(fontPath);
        if (fs.existsSync(fontsDir)) {
            const files = fs.readdirSync(fontsDir);
            const ttf = files.find(f => f.endsWith('.ttf'));
            if (ttf) {
                console.log('Found alternative font:', ttf);
                const newPath = path.join(fontsDir, ttf);
                const buffer = fs.readFileSync(newPath);
                const base64 = buffer.toString('base64');
                const content = `export const ALEF_FONT_BASE64 = "${base64}";`;

                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                fs.writeFileSync(outputPath, content);
                console.log('Font data written to ' + outputPath);
                process.exit(0);
            }
        }
        process.exit(1);
    }

    const buffer = fs.readFileSync(fontPath);
    const base64 = buffer.toString('base64');
    const content = `export const ALEF_FONT_BASE64 = "${base64}";`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);
    console.log('Font data written to ' + outputPath);

} catch (err) {
    console.error('Error processing font:', err);
    process.exit(1);
}
