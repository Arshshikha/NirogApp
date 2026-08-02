const fs = require('fs');
const path = require('path');

const historyBaseDir = 'C:\\Users\\arshshikha yadav\\AppData\\Roaming\\Code\\User\\History';

if (!fs.existsSync(historyBaseDir)) {
  console.error('History directory does not exist');
  process.exit(1);
}

const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  if (files.includes('entries.json')) {
    try {
      const entriesPath = path.join(dir, 'entries.json');
      const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      
      if (data.resource && data.resource.toLowerCase().includes('nirogapp')) {
        results.push({
          dir,
          resource: data.resource,
          entries: data.entries || []
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
    return;
  }
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      }
    } catch (e) {
      // Ignore permission or file errors
    }
  }
}

console.log('Scanning local history...');
scanDir(historyBaseDir);
console.log(`Found ${results.length} files matching NirogApp in VS Code history.`);

fs.writeFileSync('C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\scratch\\history_results.json', JSON.stringify(results, null, 2));
console.log('Results written to history_results.json');
