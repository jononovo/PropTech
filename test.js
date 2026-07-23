const fs = require('fs');
const content = fs.readFileSync('artifacts/mockup-sandbox/src/components/mockups/homium/builderData.ts', 'utf-8');
const match = content.match(/export const PURCHASE_LOAN[\s\S]*/);
console.log(match ? match[0].length : 0);
