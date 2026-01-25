const fs = require('fs');
const path = 'src/components/dashboard/tabs/CalendarTab.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split(/\r?\n/);

    // Create backup
    fs.writeFileSync(path + '.bak', content);

    // We want to delete lines 646 to 727 (1-based)
    // 1-based line 646 corresponds to 0-based index 645
    // 1-based line 727 corresponds to 0-based index 726

    // Keep lines 0 to 644 (which is lines 1 to 645)
    // Resume at index 727 (which is line 728)

    const part1 = lines.slice(0, 645);
    const part2 = lines.slice(727);

    const newContent = [...part1, ...part2].join('\n');

    fs.writeFileSync(path, newContent);
    console.log(`Successfully removed lines 646-727. New line count: ${newContent.split('\n').length}`);
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
