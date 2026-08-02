const fs = require('fs');
const path = require('path');

const historyBaseDir = 'C:\\Users\\arshshikha yadav\\AppData\\Roaming\\Code\\User\\History';

if (!fs.existsSync(historyBaseDir)) {
  console.error('History directory does not exist');
  process.exit(1);
}

const resources = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  if (files.includes('entries.json')) {
    try {
      const entriesPath = path.join(dir, 'entries.json');
      const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      if (data.resource) {
        resources.push({
          dir,
          resource: data.resource,
          count: (data.entries || []).length
        });
      }
    } catch (e) {
      // Ignore
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
    } catch (e) {}
  }
}

scanDir(historyBaseDir);
console.log(`Found ${resources.length} total file histories in VS Code.`);

// Sort by resource path
resources.sort((a, b) => a.resource.localeCompare(b.resource));

for (const res of resources) {
  console.log(`- ${res.resource} (${res.count} versions)`);
}

fs.writeFileSync('C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\scratch\\all_history_resources.json', JSON.stringify(resources, null, 2));
