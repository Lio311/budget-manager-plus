
// Mock function to replicate the logic in scan-invoice.ts
function calculateVat(data: any) {
    const amountVal = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0;

    // The simplified logic I added:
    const vatAmount = (typeof data.vatAmount === 'number' && data.vatAmount > 0)
        ? data.vatAmount
        : parseFloat((amountVal - (amountVal / 1.18)).toFixed(2));

    return vatAmount;
}

// Test cases
const cases = [
    { name: "With explicitly 0 VAT", input: { amount: 100, vatAmount: 0 }, expected: 15.25 }, // 100 - 100/1.18 = 15.254 -> 15.25
    { name: "With null VAT", input: { amount: 118, vatAmount: null }, expected: 18.00 },
    { name: "With missing VAT", input: { amount: 59 }, expected: 9.00 },
    { name: "With explicit VAT", input: { amount: 100, vatAmount: 17 }, expected: 17 },
    { name: "With string amount", input: { amount: "118" }, expected: 18.00 },
];

console.log("Running VAT Calculation Tests...");
cases.forEach(c => {
    const result = calculateVat(c.input);
    const passed = Math.abs(result - c.expected) < 0.01;
    console.log(`${c.name}: ${passed ? "PASS" : "FAIL"} (Expected ${c.expected}, Got ${result})`);
});
